<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AppSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_manual_payment_instructions_for_public_checkout(): void
    {
        $token = $this->tokenForRole('admin');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/admin/settings/manual-payment', [
                'manual_payment_instructions' => 'Transfer ke rekening resmi Pathly AI dan cantumkan nomor invoice.',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Instruksi pembayaran berhasil disimpan.');

        $this
            ->getJson('/api/payment-settings')
            ->assertOk()
            ->assertJsonPath('manual_payment_instructions', 'Transfer ke rekening resmi Pathly AI dan cantumkan nomor invoice.');
    }

    public function test_non_admin_cannot_update_manual_payment_instructions(): void
    {
        $token = $this->tokenForRole('employee');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/admin/settings/manual-payment', [
                'manual_payment_instructions' => 'Tidak boleh tersimpan.',
            ])
            ->assertForbidden();
    }

    private function tokenForRole(string $role): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => Str::headline($role),
            'email' => "{$role}-settings@growtrack.test",
            'role' => $role,
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $token;
    }
}
