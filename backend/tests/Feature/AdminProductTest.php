<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_product(): void
    {
        $token = $this->tokenForRole('admin');

        $createResponse = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/products', [
                'type' => 'course',
                'title' => 'Product Management Sprint',
                'category' => 'Business',
                'level' => 'Beginner',
                'price' => 250000,
                'description' => 'Course untuk membuat produk digital pertama.',
                'outcome' => 'Peserta punya rencana produk yang siap divalidasi.',
                'lesson_count' => 12,
                'duration' => '3 minggu',
                'material_url' => 'https://growtrack.local/materials/product-management-sprint',
                'status' => 'active',
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('product.slug', 'product-management-sprint');

        $productId = $createResponse->json('product.id');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/products/{$productId}", [
                'type' => 'course',
                'title' => 'Product Management Sprint Plus',
                'slug' => 'product-management-sprint-plus',
                'category' => 'Business',
                'level' => 'Intermediate',
                'price' => 300000,
                'description' => 'Course lanjutan untuk membuat produk digital pertama.',
                'outcome' => 'Peserta punya rencana produk plus eksperimen validasi.',
                'lesson_count' => 14,
                'duration' => '4 minggu',
                'material_url' => 'https://growtrack.local/materials/product-management-sprint-plus',
                'status' => 'inactive',
            ])
            ->assertOk()
            ->assertJsonPath('product.status', 'inactive');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/admin/products/{$productId}")
            ->assertOk();

        $this->assertDatabaseMissing('learning_products', ['id' => $productId]);
    }

    public function test_non_admin_cannot_create_product(): void
    {
        $token = $this->tokenForRole('employee');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/products', [
                'type' => 'course',
                'title' => 'Blocked Product',
                'category' => 'Business',
                'price' => 100000,
                'description' => 'Tidak boleh masuk.',
                'outcome' => 'Tidak boleh masuk.',
                'status' => 'active',
            ])
            ->assertForbidden();
    }

    public function test_draft_product_is_hidden_from_public_catalog_and_checkout(): void
    {
        $userToken = $this->tokenForRole('employee');
        $productId = DB::table('learning_products')->insertGetId([
            'type' => 'webinar',
            'title' => 'Draft Career Session',
            'slug' => 'draft-career-session',
            'category' => 'Career',
            'level' => 'Live Session',
            'price' => 99000,
            'description' => 'Sesi yang belum siap dipublish.',
            'outcome' => 'Belum tampil untuk user.',
            'lesson_count' => 1,
            'duration' => '90 menit',
            'seat_limit' => 20,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->getJson('/api/products')
            ->assertOk()
            ->assertJsonMissing(['slug' => 'draft-career-session']);

        $this
            ->withHeader('Authorization', "Bearer {$userToken}")
            ->postJson('/api/orders', [
                'product_id' => $productId,
                'payment_method' => 'manual_transfer',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Produk tidak tersedia.');
    }

    public function test_admin_cannot_publish_incomplete_product(): void
    {
        $token = $this->tokenForRole('admin');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/products', [
                'type' => 'webinar',
                'title' => 'Incomplete Webinar',
                'category' => 'Career',
                'price' => 99000,
                'description' => 'Webinar belum punya detail live session.',
                'outcome' => 'Peserta punya action plan.',
                'lesson_count' => 1,
                'status' => 'active',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Webinar active harus punya jadwal.');
    }

    private function tokenForRole(string $role): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => Str::headline($role),
            'email' => "{$role}@growtrack.test",
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
