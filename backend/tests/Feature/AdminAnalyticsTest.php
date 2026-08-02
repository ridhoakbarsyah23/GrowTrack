<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_operational_analytics(): void
    {
        $adminToken = $this->tokenForRole('admin');
        $learnerId = $this->userForRole('fresh_graduate');
        $productId = DB::table('learning_products')->insertGetId([
            'type' => 'webinar',
            'title' => 'Career Session',
            'slug' => 'career-session',
            'category' => 'Career',
            'price' => 99000,
            'description' => 'Sesi career.',
            'outcome' => 'Action plan.',
            'lesson_count' => 1,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('learning_orders')->insert([
            'invoice_number' => 'GT-ANALYTICS-1',
            'user_id' => $learnerId,
            'learning_product_id' => $productId,
            'amount' => 99000,
            'status' => 'paid',
            'payment_method' => 'manual_transfer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/admin/analytics')
            ->assertOk()
            ->assertJsonPath('users.learners', 1)
            ->assertJsonPath('products.active', 1)
            ->assertJsonPath('orders.paid.count', 1)
            ->assertJsonPath('orders.paid.revenue', 99000);
    }

    public function test_non_admin_cannot_view_operational_analytics(): void
    {
        $token = $this->tokenForRole('employee');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/analytics')
            ->assertForbidden();
    }

    private function tokenForRole(string $role): string
    {
        $userId = $this->userForRole($role);
        $token = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $token;
    }

    private function userForRole(string $role): int
    {
        return DB::table('users')->insertGetId([
            'name' => Str::headline($role) . ' Analytics',
            'email' => "{$role}-analytics-" . Str::random(6) . '@growtrack.test',
            'role' => $role,
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
