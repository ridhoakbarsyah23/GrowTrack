<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'payment_note' => ['nullable', 'string', 'max:1000'],
        ]);

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
            'payment_method' => 'manual_transfer',
            'payment_note' => $validated['payment_note'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $order = DB::table('learning_orders')->where('id', $orderId)->first();

        return response()->json([
            'message' => 'Order dibuat. Selesaikan pembayaran manual lalu tunggu admin mengaktifkan akses.',
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
            'payment_note' => $order->payment_note,
            'paid_at' => $order->paid_at,
            'created_at' => $order->created_at,
        ];
    }
}
