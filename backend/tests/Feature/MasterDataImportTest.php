<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class MasterDataImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_preview_and_import_master_data_template(): void
    {
        $token = $this->tokenForRole('admin');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/master-data-import/preview')
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('counts.career_goals', 3)
            ->assertJsonPath('counts.products', 1);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/master-data-import')
            ->assertOk()
            ->assertJsonPath('message', 'Master data berhasil diimport.');

        $this->assertDatabaseCount('career_goals', 3);
        $this->assertDatabaseCount('skills', 16);
        $this->assertDatabaseCount('learning_products', 1);
        $this->assertDatabaseHas('learning_products', [
            'slug' => 'career-readiness-review-session',
            'status' => 'draft',
        ]);
    }

    public function test_non_admin_cannot_import_master_data_template(): void
    {
        $token = $this->tokenForRole('employee');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/master-data-import')
            ->assertForbidden();
    }

    private function tokenForRole(string $role): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => Str::headline($role),
            'email' => "{$role}-import@growtrack.test",
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
