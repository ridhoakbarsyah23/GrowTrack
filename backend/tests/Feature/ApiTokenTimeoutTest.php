<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiTokenTimeoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_expires_after_thirty_minutes_of_inactivity(): void
    {
        $token = $this->tokenWithLastActivity(now()->subMinutes(31));

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertUnauthorized();

        $this->assertDatabaseMissing('api_tokens', [
            'token_hash' => hash('sha256', $token),
        ]);
    }

    public function test_token_remains_valid_before_thirty_minutes_of_inactivity(): void
    {
        $token = $this->tokenWithLastActivity(now()->subMinutes(29));

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertOk();

        $this->assertDatabaseHas('api_tokens', [
            'token_hash' => hash('sha256', $token),
        ]);
    }

    private function tokenWithLastActivity($lastActivity): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Timeout User',
            'email' => Str::random(8) . '@growtrack.test',
            'role' => 'employee',
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'last_used_at' => $lastActivity,
            'created_at' => now()->subHour(),
            'updated_at' => $lastActivity,
        ]);

        return $token;
    }
}
