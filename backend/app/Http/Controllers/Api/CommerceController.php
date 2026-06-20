<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class CommerceController extends Controller
{
    public function products()
    {
        return response()->json([
            'products' => DB::table('learning_products')
                ->select([
                    'id',
                    'type',
                    'title',
                    'slug',
                    'category',
                    'level',
                    'price',
                    'description',
                    'outcome',
                    'lesson_count',
                    'duration',
                    'scheduled_at',
                    'seat_limit',
                    'status',
                ])
                ->where('status', 'active')
                ->orderBy('type')
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function createOrder(Request $request)
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'exists:learning_products,id'],
            'payment_method' => ['nullable', Rule::in(['manual_transfer', 'midtrans_snap'])],
            'payment_note' => ['nullable', 'string', 'max:1000'],
        ]);
        $paymentMethod = $validated['payment_method'] ?? 'manual_transfer';

        if ($paymentMethod === 'midtrans_snap' && ! $this->midtransEnabled()) {
            return response()->json([
                'message' => 'Midtrans belum dikonfigurasi. Gunakan transfer manual dulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($paymentMethod === 'midtrans_snap' && $configIssue = $this->midtransConfigIssue()) {
            return response()->json([
                'message' => $configIssue,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $product = DB::table('learning_products')
            ->where('id', $validated['product_id'])
            ->where('status', 'active')
            ->first();

        if (! $product) {
            return response()->json(['message' => 'Produk tidak tersedia.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($product->type === 'webinar' && $product->seat_limit !== null) {
            $paidSeats = DB::table('learning_orders')
                ->where('learning_product_id', $product->id)
                ->where('status', 'paid')
                ->count();

            if ($paidSeats >= $product->seat_limit) {
                return response()->json(['message' => 'Kuota webinar sudah penuh.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $existing = DB::table('learning_orders')
            ->where('user_id', $user->id)
            ->where('learning_product_id', $product->id)
            ->whereIn('status', ['pending', 'paid'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => $existing->status === 'paid'
                    ? 'Produk ini sudah aktif di dashboard kamu.'
                    : 'Order produk ini masih menunggu pembayaran.',
                'order' => $this->orderPayload($existing),
            ], $existing->status === 'paid' ? Response::HTTP_OK : Response::HTTP_ACCEPTED);
        }

        $now = now();
        $orderId = DB::table('learning_orders')->insertGetId([
            'invoice_number' => $this->invoiceNumber(),
            'user_id' => $user->id,
            'learning_product_id' => $product->id,
            'amount' => $product->price,
            'status' => 'pending',
            'payment_method' => $paymentMethod,
            'payment_provider' => $paymentMethod === 'midtrans_snap' ? 'midtrans' : 'manual',
            'payment_note' => $validated['payment_note'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $order = DB::table('learning_orders')->where('id', $orderId)->first();

        if ($paymentMethod === 'midtrans_snap') {
            try {
                $snap = $this->createMidtransSnapTransaction($order, $product, $user);

                DB::table('learning_orders')
                    ->where('id', $orderId)
                    ->update([
                        'payment_reference' => $snap['token'] ?? null,
                        'payment_url' => $snap['redirect_url'] ?? null,
                        'payment_payload' => json_encode($snap),
                        'updated_at' => now(),
                    ]);

                $order = DB::table('learning_orders')->where('id', $orderId)->first();
            } catch (\Throwable $exception) {
                DB::table('learning_orders')->where('id', $orderId)->delete();
                Log::warning('Midtrans Snap transaction failed.', [
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);

                return response()->json([
                    'message' => $this->publicMidtransErrorMessage($exception->getMessage()),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        return response()->json([
            'message' => $paymentMethod === 'midtrans_snap'
                ? 'Order dibuat. Lanjutkan pembayaran melalui Midtrans.'
                : 'Order dibuat. Selesaikan pembayaran manual lalu tunggu admin mengaktifkan akses.',
            'order' => $this->orderPayload($order),
        ], Response::HTTP_CREATED);
    }

    public function myOrders(Request $request)
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'orders' => DB::table('learning_orders')
                ->join('learning_products', 'learning_products.id', '=', 'learning_orders.learning_product_id')
                ->where('learning_orders.user_id', $user->id)
                ->select([
                    'learning_orders.id',
                    'learning_orders.invoice_number',
                    'learning_orders.amount',
                    'learning_orders.status',
                    'learning_orders.payment_method',
                    'learning_orders.payment_provider',
                    'learning_orders.payment_reference',
                    'learning_orders.payment_url',
                    'learning_orders.payment_note',
                    'learning_orders.paid_at',
                    'learning_orders.created_at',
                    'learning_products.id as product_id',
                    'learning_products.type',
                    'learning_products.title',
                    'learning_products.slug',
                    'learning_products.category',
                    'learning_products.duration',
                    'learning_products.scheduled_at',
                    'learning_products.meeting_url',
                    'learning_products.material_url',
                ])
                ->orderByDesc('learning_orders.created_at')
                ->get(),
        ]);
    }

    public function adminOrders(Request $request)
    {
        $admin = $this->admin($request);

        if (! $admin) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'orders' => DB::table('learning_orders')
                ->join('learning_products', 'learning_products.id', '=', 'learning_orders.learning_product_id')
                ->join('users', 'users.id', '=', 'learning_orders.user_id')
                ->select([
                    'learning_orders.id',
                    'learning_orders.invoice_number',
                    'learning_orders.amount',
                    'learning_orders.status',
                    'learning_orders.payment_method',
                    'learning_orders.payment_provider',
                    'learning_orders.payment_reference',
                    'learning_orders.payment_url',
                    'learning_orders.payment_note',
                    'learning_orders.paid_at',
                    'learning_orders.created_at',
                    'users.name as customer_name',
                    'users.email as customer_email',
                    'learning_products.title as product_title',
                    'learning_products.type as product_type',
                ])
                ->orderByDesc('learning_orders.created_at')
                ->get(),
        ]);
    }

    public function updateOrderStatus(Request $request, int $order)
    {
        $admin = $this->admin($request);

        if (! $admin) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'cancelled'])],
        ]);

        $record = DB::table('learning_orders')->where('id', $order)->first();

        if (! $record) {
            return response()->json(['message' => 'Order tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        DB::table('learning_orders')
            ->where('id', $order)
            ->update([
                'status' => $validated['status'],
                'paid_at' => $validated['status'] === 'paid' ? ($record->paid_at ?: now()) : null,
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Status order berhasil diperbarui.']);
    }

    public function midtransNotification(Request $request)
    {
        if (! $this->midtransEnabled()) {
            return response()->json(['message' => 'Midtrans is not configured.'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $payload = $request->all();
        $required = ['order_id', 'status_code', 'gross_amount', 'signature_key', 'transaction_status'];

        foreach ($required as $key) {
            if (! isset($payload[$key])) {
                return response()->json(['message' => "Missing {$key}."], Response::HTTP_BAD_REQUEST);
            }
        }

        $signature = hash('sha512', $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . config('services.midtrans.server_key'));

        if (! hash_equals($signature, $payload['signature_key'])) {
            return response()->json(['message' => 'Invalid signature.'], Response::HTTP_FORBIDDEN);
        }

        $order = DB::table('learning_orders')
            ->where('invoice_number', $payload['order_id'])
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], Response::HTTP_NOT_FOUND);
        }

        if ((int) round((float) $payload['gross_amount']) !== (int) $order->amount) {
            return response()->json(['message' => 'Invalid gross amount.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $transactionStatus = $payload['transaction_status'];
        $fraudStatus = $payload['fraud_status'] ?? null;
        $nextStatus = $order->status;
        $paidAt = $order->paid_at;

        if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && ($fraudStatus === null || $fraudStatus === 'accept'))) {
            $nextStatus = 'paid';
            $paidAt = $order->paid_at ?: now();
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire', 'failure'], true)) {
            $nextStatus = 'cancelled';
            $paidAt = null;
        } elseif ($transactionStatus === 'pending') {
            $nextStatus = 'pending';
        }

        DB::table('learning_orders')
            ->where('id', $order->id)
            ->update([
                'status' => $nextStatus,
                'payment_method' => $payload['payment_type'] ?? $order->payment_method,
                'payment_provider' => 'midtrans',
                'payment_reference' => $payload['transaction_id'] ?? $order->payment_reference,
                'payment_payload' => json_encode($payload),
                'paid_at' => $paidAt,
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'OK']);
    }

    private function admin(Request $request): ?object
    {
        $user = ApiToken::user($request);

        return $user && $user->role === 'admin' ? $user : null;
    }

    private function invoiceNumber(): string
    {
        do {
            $invoice = 'GT-' . now()->format('ymd') . '-' . Str::upper(Str::random(6));
        } while (DB::table('learning_orders')->where('invoice_number', $invoice)->exists());

        return $invoice;
    }

    private function orderPayload(object $order): array
    {
        return [
            'id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'product_id' => $order->learning_product_id,
            'amount' => $order->amount,
            'status' => $order->status,
            'payment_method' => $order->payment_method,
            'payment_provider' => $order->payment_provider ?? null,
            'payment_reference' => $order->payment_reference ?? null,
            'payment_url' => $order->payment_url ?? null,
            'payment_note' => $order->payment_note,
            'paid_at' => $order->paid_at,
            'created_at' => $order->created_at,
        ];
    }

    private function createMidtransSnapTransaction(object $order, object $product, object $user): array
    {
        $response = Http::withBasicAuth(config('services.midtrans.server_key'), '')
            ->acceptJson()
            ->asJson()
            ->post($this->midtransSnapEndpoint(), [
                'transaction_details' => [
                    'order_id' => $order->invoice_number,
                    'gross_amount' => (int) $order->amount,
                ],
                'customer_details' => [
                    'first_name' => $user->name,
                    'email' => $user->email,
                ],
                'item_details' => [
                    [
                        'id' => (string) $product->id,
                        'price' => (int) $order->amount,
                        'quantity' => 1,
                        'name' => Str::limit($product->title, 50, ''),
                        'category' => $product->category,
                    ],
                ],
                'callbacks' => array_filter([
                    'finish' => config('services.midtrans.finish_url'),
                ]),
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Midtrans Snap API error: ' . $response->body());
        }

        return $response->json();
    }

    private function publicMidtransErrorMessage(string $message): string
    {
        if (str_contains($message, 'Access denied due to unauthorized transaction')) {
            return 'Midtrans menolak key yang aktif. Copy ulang Server Key dari Settings > Access Keys sesuai environment yang dipakai, lalu restart backend.';
        }

        return 'Payment link Midtrans belum bisa dibuat. Coba lagi atau gunakan transfer manual.';
    }

    private function midtransEnabled(): bool
    {
        return (bool) config('services.midtrans.enabled') && filled(config('services.midtrans.server_key'));
    }

    private function midtransConfigIssue(): ?string
    {
        $environment = config('services.midtrans.environment');
        $serverKey = (string) config('services.midtrans.server_key');

        if ($environment === 'sandbox' && ! Str::startsWith($serverKey, ['Mid-server-', 'SB-Mid-server-'])) {
            return 'MIDTRANS_ENV=sandbox harus memakai Server Key dari dashboard Sandbox Midtrans.';
        }

        if ($environment === 'production' && ! Str::startsWith($serverKey, 'Mid-server-')) {
            return 'MIDTRANS_ENV=production harus memakai Production Server Key yang diawali Mid-server-.';
        }

        return null;
    }

    private function midtransSnapEndpoint(): string
    {
        return config('services.midtrans.environment') === 'production'
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }
}
