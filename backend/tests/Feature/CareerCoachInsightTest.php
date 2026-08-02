<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class CareerCoachInsightTest extends TestCase
{
    use RefreshDatabase;

    public function test_career_coach_insight_summarizes_profile_gap_and_next_roadmap(): void
    {
        [$token] = $this->fixture();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/career-coach/insight')
            ->assertOk()
            ->assertJsonPath('mode', 'deterministic')
            ->assertJsonPath('provider_status', 'disabled')
            ->assertJsonPath('focus.skill', 'REST API')
            ->assertJsonPath('focus.gap', 40)
            ->assertJsonPath('next_roadmap.title', 'Build REST API')
            ->assertJsonPath('signals.assessment_score', 70)
            ->assertJsonCount(4, 'recommended_actions');
    }

    public function test_career_coach_insight_can_use_openai_when_enabled(): void
    {
        [$token] = $this->fixture();

        Config::set('services.openai.coach_enabled', true);
        Config::set('services.openai.key', 'test-key');
        Config::set('services.openai.model', 'gpt-5');
        Config::set('services.openai.base_url', 'https://api.openai.com/v1');

        Http::fake([
            'api.openai.com/v1/responses' => Http::response([
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'headline' => 'AI headline',
                                    'summary' => 'AI summary',
                                    'recommended_actions' => ['Aksi satu', 'Aksi dua', 'Aksi tiga'],
                                ]),
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/career-coach/insight')
            ->assertOk()
            ->assertJsonPath('mode', 'openai')
            ->assertJsonPath('provider_status', 'openai_enhanced')
            ->assertJsonPath('model', 'gpt-5')
            ->assertJsonPath('headline', 'AI headline')
            ->assertJsonPath('summary', 'AI summary')
            ->assertJsonPath('recommended_actions.0', 'Aksi satu')
            ->assertJsonPath('focus.skill', 'REST API')
            ->assertJsonPath('next_roadmap.title', 'Build REST API');
    }

    public function test_career_coach_insight_falls_back_when_openai_key_is_missing(): void
    {
        [$token] = $this->fixture();

        Config::set('services.openai.coach_enabled', true);
        Config::set('services.openai.key', null);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/career-coach/insight')
            ->assertOk()
            ->assertJsonPath('mode', 'deterministic')
            ->assertJsonPath('provider_status', 'missing_api_key')
            ->assertJsonPath('focus.skill', 'REST API');
    }

    private function fixture(): array
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Coach User',
            'email' => 'coach-' . Str::random(6) . '@growtrack.test',
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

        DB::table('roadmap_modules')->insert([
            [
                'career_goal_id' => $goalId,
                'skill_id' => $sqlSkillId,
                'sequence' => 1,
                'title' => 'Practice SQL Query',
                'module_type' => 'practice',
                'duration_hours' => 3,
                'outcome' => 'User menguasai query dasar.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'career_goal_id' => $goalId,
                'skill_id' => $apiSkillId,
                'sequence' => 2,
                'title' => 'Build REST API',
                'module_type' => 'project',
                'duration_hours' => 5,
                'outcome' => 'User membangun API sederhana.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        foreach (DB::table('roadmap_modules')->pluck('id') as $moduleId) {
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
