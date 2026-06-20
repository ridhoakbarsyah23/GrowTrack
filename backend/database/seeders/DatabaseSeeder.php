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
        $now = now();
        $adminEmail = 'admin@growtrack.id';

        if (
            DB::table('users')->where('email', 'admin@growtrack.test')->exists()
            && ! DB::table('users')->where('email', $adminEmail)->exists()
        ) {
            DB::table('users')
                ->where('email', 'admin@growtrack.test')
                ->update([
                    'email' => $adminEmail,
                    'updated_at' => $now,
                ]);
        }

        DB::table('users')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'name' => 'GrowTrack Admin',
                'role' => 'admin',
                'password' => Hash::make('123456789'),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $products = [
            [
                'type' => 'course',
                'title' => 'Career Growth Sprint',
                'slug' => 'career-growth-sprint',
                'category' => 'Career',
                'level' => 'Beginner',
                'price' => 299000,
                'description' => 'Program mandiri untuk menyusun roadmap karir, skill matrix, dan portfolio evidence.',
                'outcome' => 'Peserta punya career plan, roadmap belajar, dan evidence yang siap direview mentor.',
                'lesson_count' => 18,
                'duration' => '4 minggu',
                'scheduled_at' => null,
                'seat_limit' => null,
                'meeting_url' => null,
                'material_url' => 'https://growtrack.local/materials/career-growth-sprint',
                'status' => 'active',
            ],
            [
                'type' => 'course',
                'title' => 'AI Productivity for Work',
                'slug' => 'ai-productivity-for-work',
                'category' => 'AI Tools',
                'level' => 'Intermediate',
                'price' => 349000,
                'description' => 'Course praktis untuk memakai AI dalam riset, dokumen kerja, konten, dan workflow harian.',
                'outcome' => 'Peserta bisa membangun workflow kerja yang lebih cepat dengan template AI siap pakai.',
                'lesson_count' => 22,
                'duration' => '5 minggu',
                'scheduled_at' => null,
                'seat_limit' => null,
                'meeting_url' => null,
                'material_url' => 'https://growtrack.local/materials/ai-productivity-for-work',
                'status' => 'active',
            ],
            [
                'type' => 'course',
                'title' => 'Digital Marketing Launchpad',
                'slug' => 'digital-marketing-launchpad',
                'category' => 'Marketing',
                'level' => 'Project based',
                'price' => 399000,
                'description' => 'Course project based untuk membuat campaign, landing page, funnel, dan report performa.',
                'outcome' => 'Peserta bisa merancang campaign digital dan membaca metrik funnel untuk bisnis.',
                'lesson_count' => 26,
                'duration' => '6 minggu',
                'scheduled_at' => null,
                'seat_limit' => null,
                'meeting_url' => null,
                'material_url' => 'https://growtrack.local/materials/digital-marketing-launchpad',
                'status' => 'active',
            ],
            [
                'type' => 'webinar',
                'title' => 'Bangun Personal Branding LinkedIn',
                'slug' => 'bangun-personal-branding-linkedin',
                'category' => 'Career Growth',
                'level' => 'Live Session',
                'price' => 49000,
                'description' => 'Webinar live untuk membuat positioning, konten profil, dan rutinitas LinkedIn yang realistis.',
                'outcome' => 'Peserta punya arah personal branding dan draft konten LinkedIn pertama.',
                'lesson_count' => 1,
                'duration' => '2 jam',
                'scheduled_at' => '2026-06-24 19:30:00',
                'seat_limit' => 80,
                'meeting_url' => 'https://meet.google.com/growtrack-linkedin-demo',
                'material_url' => null,
                'status' => 'active',
            ],
            [
                'type' => 'webinar',
                'title' => 'Strategi Jualan Course Pertama',
                'slug' => 'strategi-jualan-course-pertama',
                'category' => 'Creator Business',
                'level' => 'Live Session',
                'price' => 79000,
                'description' => 'Webinar live untuk validasi topik, susun offer, dan membuka batch course pertama.',
                'outcome' => 'Peserta memahami langkah launch course pertama dengan checkout manual.',
                'lesson_count' => 1,
                'duration' => '2 jam',
                'scheduled_at' => '2026-06-29 20:00:00',
                'seat_limit' => 120,
                'meeting_url' => 'https://meet.google.com/growtrack-demo',
                'material_url' => null,
                'status' => 'active',
            ],
            [
                'type' => 'webinar',
                'title' => 'AI Workflow untuk Admin & Founder',
                'slug' => 'ai-workflow-untuk-admin-founder',
                'category' => 'AI Operations',
                'level' => 'Live Session',
                'price' => 59000,
                'description' => 'Webinar live untuk menyusun workflow AI bagi admin, founder, dan tim operasional kecil.',
                'outcome' => 'Peserta punya checklist workflow AI untuk riset, SOP, dokumen, dan follow-up harian.',
                'lesson_count' => 1,
                'duration' => '2 jam',
                'scheduled_at' => '2026-07-03 19:00:00',
                'seat_limit' => 100,
                'meeting_url' => 'https://meet.google.com/growtrack-ai-workflow-demo',
                'material_url' => null,
                'status' => 'active',
            ],
        ];

        foreach ($products as $product) {
            DB::table('learning_products')->updateOrInsert(
                ['slug' => $product['slug']],
                [
                    ...$product,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }
}
