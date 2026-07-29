<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserJourneyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_own_roadmap_progress_and_submit_project(): void
    {
        [$token, $progressId] = $this->journeyFixture();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/roadmap-progress/{$progressId}", [
                'status' => 'in_progress',
                'progress_percent' => 50,
                'due_date' => '2026-07-01',
            ])
            ->assertOk();

        $this->assertDatabaseHas('roadmap_progress', [
            'id' => $progressId,
            'status' => 'in_progress',
            'progress_percent' => 50,
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/project-submissions', [
                'roadmap_progress_id' => $progressId,
                'title' => 'Weekly Sync Evidence',
                'description' => 'Link dan ringkasan hasil weekly sync.',
            ])
            ->assertCreated()
            ->assertJsonStructure(['message', 'submission_id']);

        $this->assertDatabaseHas('project_submissions', [
            'title' => 'Weekly Sync Evidence',
            'status' => 'submitted',
        ]);
        $this->assertDatabaseHas('roadmap_progress', [
            'id' => $progressId,
            'status' => 'completed',
            'progress_percent' => 100,
        ]);
    }

    public function test_user_cannot_update_another_users_progress(): void
    {
        [, $progressId] = $this->journeyFixture();
        [$otherToken] = $this->journeyFixture('other');

        $this
            ->withHeader('Authorization', "Bearer {$otherToken}")
            ->patchJson("/api/roadmap-progress/{$progressId}", [
                'status' => 'completed',
                'progress_percent' => 100,
            ])
            ->assertNotFound();
    }

    public function test_mentor_can_review_project_submission_and_employee_cannot(): void
    {
        [$token, $progressId] = $this->journeyFixture();

        $submissionId = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/project-submissions', [
                'roadmap_progress_id' => $progressId,
                'title' => 'Leadership Evidence',
                'description' => 'Evidence untuk direview mentor.',
            ])
            ->assertCreated()
            ->json('submission_id');

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/project-submissions/{$submissionId}/review", [
                'status' => 'reviewed',
                'score' => 90,
                'review_notes' => 'Tidak boleh direview oleh employee.',
            ])
            ->assertForbidden();

        $mentorToken = $this->tokenForRole('mentor');

        $this
            ->withHeader('Authorization', "Bearer {$mentorToken}")
            ->patchJson("/api/project-submissions/{$submissionId}/review", [
                'status' => 'reviewed',
                'score' => 90,
                'review_notes' => 'Evidence kuat dan relevan.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('project_submissions', [
            'id' => $submissionId,
            'status' => 'reviewed',
            'score' => 90,
            'review_notes' => 'Evidence kuat dan relevan.',
        ]);
    }

    public function test_mentor_can_view_review_queue_and_employee_cannot(): void
    {
        [$token, $progressId] = $this->journeyFixture();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/project-submissions', [
                'roadmap_progress_id' => $progressId,
                'title' => 'Queue Evidence',
                'description' => 'Evidence yang masuk queue.',
            ])
            ->assertCreated();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/project-submissions/review-queue')
            ->assertForbidden();

        $mentorToken = $this->tokenForRole('mentor');

        $this
            ->withHeader('Authorization', "Bearer {$mentorToken}")
            ->getJson('/api/project-submissions/review-queue')
            ->assertOk()
            ->assertJsonPath('submissions.0.title', 'Queue Evidence');
    }

    private function journeyFixture(string $suffix = 'user'): array
    {
        $userId = DB::table('users')->insertGetId([
            'name' => "Journey {$suffix}",
            'email' => "journey-{$suffix}-" . Str::random(6) . '@growtrack.test',
            'role' => 'employee',
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'employee',
            'title' => "Growth Track {$suffix}",
            'level' => 'Mid',
            'summary' => 'Track untuk user journey.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $profileId = DB::table('user_profiles')->insertGetId([
            'user_id' => $userId,
            'career_goal_id' => $goalId,
            'role' => 'employee',
            'department' => 'Product',
            'current_position' => 'Associate',
            'target_position' => 'Lead',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $moduleId = DB::table('roadmap_modules')->insertGetId([
            'career_goal_id' => $goalId,
            'sequence' => 1,
            'title' => 'Lead Weekly Sync',
            'module_type' => 'project',
            'duration_hours' => 4,
            'outcome' => 'User bisa memimpin weekly sync.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $progressId = DB::table('roadmap_progress')->insertGetId([
            'user_profile_id' => $profileId,
            'roadmap_module_id' => $moduleId,
            'status' => 'not_started',
            'progress_percent' => 0,
            'due_date' => null,
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

        return [$token, $progressId, $profileId, $moduleId];
    }

    private function tokenForRole(string $role): string
    {
        $userId = DB::table('users')->insertGetId([
            'name' => Str::headline($role),
            'email' => "{$role}-" . Str::random(6) . '@growtrack.test',
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
