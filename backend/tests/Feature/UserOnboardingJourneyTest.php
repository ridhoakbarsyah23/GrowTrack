<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserOnboardingJourneyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_complete_assessment_and_open_personalized_dashboard(): void
    {
        $fixture = $this->onboardingFixture();

        $registration = $this
            ->postJson('/api/register', [
                'name' => 'Alya Mahasiswa',
                'email' => 'alya-' . Str::random(6) . '@growtrack.test',
                'password' => 'password123',
                'role' => 'student',
                'career_goal_id' => $fixture['goal_id'],
                'education' => 'S1 Informatika',
                'current_position' => 'Mahasiswa semester akhir',
                'experience_summary' => 'Pernah membuat aplikasi CRUD sederhana.',
                'self_reported_skills' => 'SQL dasar, PHP dasar',
                'interests' => 'Backend dan integrasi API',
                'target_position' => 'Backend Developer',
            ])
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJsonPath('user.role', 'student');

        $token = $registration->json('token');

        $currentAssessment = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/assessment/current')
            ->assertOk()
            ->assertJsonPath('profile.role', 'student')
            ->assertJsonPath('profile.career_goal', 'Backend Developer')
            ->assertJsonPath('template.id', $fixture['template_id'])
            ->assertJsonCount(2, 'questions')
            ->assertJsonPath('questions.0.skill', 'SQL')
            ->assertJsonPath('questions.1.skill', 'REST API');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/assessment/submit', [
                'assessment_template_id' => $currentAssessment->json('template.id'),
                'answers' => [
                    ['question_id' => $fixture['question_ids']['SQL'], 'score' => 5],
                    ['question_id' => $fixture['question_ids']['REST API'], 'score' => 2],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('overall_score', 70)
            ->assertJsonPath('career_profile.headline', 'Mahasiswa menuju Backend Developer')
            ->assertJsonPath('career_profile.development_priorities.0.skill', 'REST API')
            ->assertJsonPath('skill_gap_analysis.items.0.skill', 'REST API')
            ->assertJsonPath('skill_gap_analysis.items.0.gap', 40);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/career-dashboard')
            ->assertOk()
            ->assertJsonPath('current_user.role', 'student')
            ->assertJsonCount(1, 'profiles')
            ->assertJsonPath('profiles.0.career_goal', 'Backend Developer')
            ->assertJsonPath('profiles.0.assessment.overall_score', 70)
            ->assertJsonPath('profiles.0.assessment.skill_gaps.0.skill', 'REST API')
            ->assertJsonPath('profiles.0.roadmap_progress.0.title', 'Build REST API')
            ->assertJsonPath('profiles.0.roadmap_progress.0.recommended_order', 1)
            ->assertJsonPath('profiles.0.roadmap_progress.0.related_gap.skill', 'REST API')
            ->assertJsonPath('profiles.0.readiness_score', 28)
            ->assertJsonPath('profiles.0.readiness_status', 'Belum siap');

        $this->assertDatabaseHas('assessment_results', [
            'assessment_template_id' => $fixture['template_id'],
            'overall_score' => 70,
        ]);
    }

    public function test_register_duplicate_email_returns_user_friendly_validation_message(): void
    {
        $fixture = $this->onboardingFixture();

        DB::table('users')->insert([
            'name' => 'Existing User',
            'email' => 'existing@growtrack.test',
            'role' => 'student',
            'password' => bcrypt('password123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->postJson('/api/register', [
                'name' => 'Alya Mahasiswa',
                'email' => 'existing@growtrack.test',
                'password' => 'password123',
                'role' => 'student',
                'career_goal_id' => $fixture['goal_id'],
                'education' => 'S1 Informatika',
                'current_position' => 'Mahasiswa semester akhir',
                'experience_summary' => 'Pernah membuat aplikasi CRUD sederhana.',
                'self_reported_skills' => 'SQL dasar, PHP dasar',
                'interests' => 'Backend dan integrasi API',
                'target_position' => 'Backend Developer',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.')
            ->assertJsonPath('errors.email.0', 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.');
    }

    private function onboardingFixture(): array
    {
        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'student',
            'title' => 'Backend Developer',
            'level' => 'Entry',
            'summary' => 'Track persiapan backend developer.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sqlSkillId = DB::table('skills')->insertGetId([
            'name' => 'SQL',
            'category' => 'Backend',
            'description' => 'Kemampuan query dan desain database.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $apiSkillId = DB::table('skills')->insertGetId([
            'name' => 'REST API',
            'category' => 'Backend',
            'description' => 'Kemampuan membuat API.',
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

        $templateId = DB::table('assessment_templates')->insertGetId([
            'audience' => 'student',
            'title' => 'Student Career Readiness',
            'description' => 'Assessment awal mahasiswa.',
            'question_count' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sqlQuestionId = DB::table('assessment_questions')->insertGetId([
            'assessment_template_id' => $templateId,
            'skill_id' => $sqlSkillId,
            'question' => 'Seberapa siap kamu memakai SQL?',
            'weight' => 1,
            'max_score' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $apiQuestionId = DB::table('assessment_questions')->insertGetId([
            'assessment_template_id' => $templateId,
            'skill_id' => $apiSkillId,
            'question' => 'Seberapa siap kamu membuat REST API?',
            'weight' => 1,
            'max_score' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'goal_id' => $goalId,
            'template_id' => $templateId,
            'question_ids' => [
                'SQL' => $sqlQuestionId,
                'REST API' => $apiQuestionId,
            ],
        ];
    }
}
