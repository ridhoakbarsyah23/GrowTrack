<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class CareerDashboardPersonalizedRoadmapTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_prioritizes_roadmap_modules_by_largest_skill_gap(): void
    {
        [$token] = $this->dashboardFixture();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/career-dashboard')
            ->assertOk()
            ->assertJsonPath('profiles.0.roadmap_progress.0.title', 'Build REST API')
            ->assertJsonPath('profiles.0.roadmap_progress.0.recommended_order', 1)
            ->assertJsonPath('profiles.0.roadmap_progress.0.related_gap.skill', 'REST API')
            ->assertJsonPath('profiles.0.roadmap_progress.0.related_gap.gap', 40);
    }

    private function dashboardFixture(): array
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Roadmap User',
            'email' => 'roadmap-' . Str::random(6) . '@growtrack.test',
            'role' => 'student',
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'student',
            'title' => 'Backend Developer',
            'level' => 'Entry',
            'summary' => 'Track backend.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sqlSkillId = DB::table('skills')->insertGetId([
            'name' => 'SQL',
            'category' => 'Backend',
            'description' => 'Database skill.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $apiSkillId = DB::table('skills')->insertGetId([
            'name' => 'REST API',
            'category' => 'Backend',
            'description' => 'API skill.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('career_goal_skill')->insert([
            [
                'career_goal_id' => $goalId,
                'skill_id' => $sqlSkillId,
                'target_score' => 80,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'career_goal_id' => $goalId,
                'skill_id' => $apiSkillId,
                'target_score' => 80,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $profileId = DB::table('user_profiles')->insertGetId([
            'user_id' => $userId,
            'career_goal_id' => $goalId,
            'role' => 'student',
            'education' => 'S1 Informatika',
            'department' => null,
            'current_position' => 'Mahasiswa',
            'experience_summary' => null,
            'self_reported_skills' => 'SQL',
            'interests' => 'Backend',
            'target_position' => 'Backend Developer',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $templateId = DB::table('assessment_templates')->insertGetId([
            'audience' => 'student',
            'title' => 'Backend Readiness',
            'description' => 'Assessment.',
            'question_count' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assessment_results')->insert([
            'user_profile_id' => $profileId,
            'assessment_template_id' => $templateId,
            'overall_score' => 70,
            'skill_scores' => json_encode([
                'SQL' => 80,
                'REST API' => 40,
            ]),
            'summary' => 'Assessment selesai.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sqlModuleId = DB::table('roadmap_modules')->insertGetId([
            'career_goal_id' => $goalId,
            'skill_id' => $sqlSkillId,
            'sequence' => 1,
            'title' => 'Practice SQL Query',
            'module_type' => 'practice',
            'duration_hours' => 3,
            'outcome' => 'User menguasai query dasar.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $apiModuleId = DB::table('roadmap_modules')->insertGetId([
            'career_goal_id' => $goalId,
            'skill_id' => $apiSkillId,
            'sequence' => 2,
            'title' => 'Build REST API',
            'module_type' => 'project',
            'duration_hours' => 5,
            'outcome' => 'User membangun API sederhana.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ([$sqlModuleId, $apiModuleId] as $moduleId) {
            DB::table('roadmap_progress')->insert([
                'user_profile_id' => $profileId,
                'roadmap_module_id' => $moduleId,
                'status' => 'not_started',
                'progress_percent' => 0,
                'due_date' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $token = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$token];
    }
}
