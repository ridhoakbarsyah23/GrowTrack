<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $adminEmail = env('SEED_ADMIN_EMAIL');
        $adminPassword = env('SEED_ADMIN_PASSWORD');

        if (! $adminEmail || ! $adminPassword) {
            return;
        }

        DB::table('users')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'name' => env('SEED_ADMIN_NAME', 'Pathly AI Admin'),
                'role' => 'admin',
                'password' => Hash::make($adminPassword),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }
}
