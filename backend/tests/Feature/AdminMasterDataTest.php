<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_and_delete_master_data(): void
    {
        $token = $this->adminToken();

        $goalId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/career-goals', [
                'audience' => 'employee',
                'title' => 'Junior Manager Track',
                'level' => 'Mid',
                'summary' => 'Jalur awal untuk naik ke manager.',
            ])
            ->assertCreated()
            ->json('id');

        $skillId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/skills', [
                'name' => 'Leadership',
                'category' => 'Management',
                'description' => 'Kemampuan memimpin tim kecil.',
            ])
            ->assertCreated()
            ->json('id');

        $templateId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/assessment-templates', [
                'audience' => 'employee',
                'title' => 'Manager Readiness',
                'description' => 'Assessment kesiapan manager.',
                'question_count' => 3,
            ])
            ->assertCreated()
            ->json('id');

        $moduleId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/roadmap-modules', [
                'career_goal_id' => $goalId,
                'sequence' => 1,
                'title' => 'Lead Weekly Sync',
                'module_type' => 'project',
                'duration_hours' => 4,
                'outcome' => 'User bisa memimpin weekly sync.',
            ])
            ->assertCreated()
            ->json('id');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/skill-targets', [
                'career_goal_id' => $goalId,
                'skill_id' => $skillId,
                'target_score' => 80,
            ])
            ->assertCreated();

        $targetId = DB::table('career_goal_skill')->value('id');

        $questionId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/assessment-questions', [
                'assessment_template_id' => $templateId,
                'skill_id' => $skillId,
                'question' => 'Seberapa siap kamu memimpin ritual mingguan tim?',
                'weight' => 2,
                'max_score' => 5,
            ])
            ->assertCreated()
            ->json('id');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/career-goals/{$goalId}", [
                'audience' => 'employee',
                'title' => 'People Manager Track',
                'level' => 'Mid',
                'summary' => 'Jalur untuk naik ke manager.',
            ])
            ->assertOk();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/skills/{$skillId}", [
                'name' => 'Team Leadership',
                'category' => 'Management',
                'description' => 'Kemampuan memimpin dan mengarahkan tim kecil.',
            ])
            ->assertOk();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/assessment-templates/{$templateId}", [
                'audience' => 'employee',
                'title' => 'People Manager Readiness',
                'description' => 'Assessment kesiapan people manager.',
                'question_count' => 4,
            ])
            ->assertOk();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/roadmap-modules/{$moduleId}", [
                'career_goal_id' => $goalId,
                'sequence' => 2,
                'title' => 'Lead Team Retrospective',
                'module_type' => 'project',
                'duration_hours' => 5,
                'outcome' => 'User bisa memimpin retrospective.',
            ])
            ->assertOk();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/skill-targets/{$targetId}", [
                'career_goal_id' => $goalId,
                'skill_id' => $skillId,
                'target_score' => 85,
            ])
            ->assertOk();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/assessment-questions/{$questionId}", [
                'assessment_template_id' => $templateId,
                'skill_id' => $skillId,
                'question' => 'Seberapa siap kamu memimpin retrospective tim?',
                'weight' => 3,
                'max_score' => 5,
            ])
            ->assertOk();

        $this->assertDatabaseHas('career_goals', ['id' => $goalId, 'title' => 'People Manager Track']);
        $this->assertDatabaseHas('skills', ['id' => $skillId, 'name' => 'Team Leadership']);
        $this->assertDatabaseHas('assessment_templates', ['id' => $templateId, 'question_count' => 4]);
        $this->assertDatabaseHas('roadmap_modules', ['id' => $moduleId, 'sequence' => 2]);
        $this->assertDatabaseHas('career_goal_skill', ['id' => $targetId, 'target_score' => 85]);
        $this->assertDatabaseHas('assessment_questions', ['id' => $questionId, 'weight' => 3]);

        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/assessment-questions/{$questionId}")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/skill-targets/{$targetId}")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/roadmap-modules/{$moduleId}")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/assessment-templates/{$templateId}")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/skills/{$skillId}")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson("/api/admin/career-goals/{$goalId}")->assertOk();
    }

    public function test_admin_cannot_delete_career_goal_that_has_relations(): void
    {
        $token = $this->adminToken();
        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'employee',
            'title' => 'Related Goal',
            'level' => 'Mid',
            'summary' => 'Goal yang punya relasi.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('roadmap_modules')->insert([
            'career_goal_id' => $goalId,
            'sequence' => 1,
            'title' => 'Related Module',
            'module_type' => 'project',
            'duration_hours' => 2,
            'outcome' => 'Ada relasi.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/admin/career-goals/{$goalId}")
            ->assertUnprocessable();
    }

    private function adminToken(): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Admin',
            'email' => Str::random(8) . '@growtrack.test',
            'role' => 'admin',
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
