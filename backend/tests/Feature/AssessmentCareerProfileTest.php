<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AssessmentCareerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_assessment_submit_returns_career_profile_output(): void
    {
        [$token, $templateId, $questionIds] = $this->assessmentFixture();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/assessment/submit', [
                'assessment_template_id' => $templateId,
                'answers' => [
                    ['question_id' => $questionIds['SQL'], 'score' => 5],
                    ['question_id' => $questionIds['REST API'], 'score' => 2],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('overall_score', 70)
            ->assertJsonPath('career_profile.headline', 'Mahasiswa menuju Backend Developer')
            ->assertJsonPath('career_profile.readiness_level', 'Fondasi kuat')
            ->assertJsonPath('career_profile.strengths.0.skill', 'SQL')
            ->assertJsonPath('career_profile.development_priorities.0.skill', 'REST API')
            ->assertJsonPath('skill_gap_analysis.items.0.skill', 'REST API')
            ->assertJsonPath('skill_gap_analysis.items.0.gap', 40)
            ->assertJsonPath('skill_gap_analysis.summary.priority_count', 1)
            ->assertJsonStructure([
                'career_profile' => [
                    'headline',
                    'summary',
                    'target',
                    'background',
                    'strengths',
                    'development_priorities',
                    'next_steps',
                ],
                'skill_gap_analysis' => [
                    'items',
                    'summary',
                ],
            ]);

        $this->assertDatabaseHas('assessment_results', [
            'overall_score' => 70,
        ]);
    }

    public function test_assessment_uses_default_target_when_career_goal_targets_are_missing(): void
    {
        [$token, $templateId, $questionIds] = $this->assessmentFixture(withTargets: false);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/assessment/submit', [
                'assessment_template_id' => $templateId,
                'answers' => [
                    ['question_id' => $questionIds['SQL'], 'score' => 3],
                    ['question_id' => $questionIds['REST API'], 'score' => 2],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('skill_gap_analysis.summary.target_source', 'assessment_default')
            ->assertJsonPath('skill_gap_analysis.summary.default_target_score', 80)
            ->assertJsonPath('skill_gap_analysis.items.0.target_source', 'assessment_default')
            ->assertJsonPath('skill_gap_analysis.items.0.target_score', 80);
    }

    private function assessmentFixture(bool $withTargets = true): array
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Student Learner',
            'email' => 'student-' . Str::random(6) . '@growtrack.test',
            'role' => 'student',
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'student',
            'title' => 'Backend Developer',
            'level' => 'Entry',
            'summary' => 'Track persiapan backend developer.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_profiles')->insert([
            'user_id' => $userId,
            'career_goal_id' => $goalId,
            'role' => 'student',
            'education' => 'S1 Informatika',
            'department' => null,
            'current_position' => 'Mahasiswa semester akhir',
            'experience_summary' => 'Pernah membuat API sederhana.',
            'self_reported_skills' => 'PHP, SQL dasar',
            'interests' => 'Backend, database, cloud',
            'target_position' => 'Backend Developer',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $templateId = DB::table('assessment_templates')->insertGetId([
            'audience' => 'student',
            'title' => 'Student Career Readiness',
            'description' => 'Assessment awal mahasiswa.',
            'question_count' => 2,
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

        if ($withTargets) {
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
        }

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

        $token = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            $token,
            $templateId,
            [
                'SQL' => $sqlQuestionId,
                'REST API' => $apiQuestionId,
            ],
        ];
    }
}
