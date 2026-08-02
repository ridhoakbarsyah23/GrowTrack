<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AppSettingsController extends Controller
{
    private const MANUAL_PAYMENT_KEY = 'manual_payment_instructions';

    public function paymentSettings()
    {
        return response()->json([
            'manual_payment_instructions' => $this->setting(self::MANUAL_PAYMENT_KEY),
        ]);
    }

    public function updateManualPayment(Request $request)
    {
        $admin = ApiToken::user($request);

        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'manual_payment_instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->updateSetting(self::MANUAL_PAYMENT_KEY, $validated['manual_payment_instructions'] ?? null);

        return response()->json(['message' => 'Instruksi pembayaran berhasil disimpan.']);
    }

    public static function manualPaymentInstructions(): ?string
    {
        return DB::table('app_settings')
            ->where('key', self::MANUAL_PAYMENT_KEY)
            ->value('value');
    }

    private function setting(string $key): ?string
    {
        return DB::table('app_settings')->where('key', $key)->value('value');
    }

    private function updateSetting(string $key, ?string $value): void
    {
        DB::table('app_settings')->updateOrInsert(
            ['key' => $key],
            [
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }
}
