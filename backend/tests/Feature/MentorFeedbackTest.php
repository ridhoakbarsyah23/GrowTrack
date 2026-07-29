<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class MentorFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_create_update_and_delete_feedback(): void
    {
        $profileId = $this->profileFixture();
        $mentorToken = $this->tokenForRole('mentor');

        $this
            ->withHeader('Authorization', "Bearer {$mentorToken}")
            ->postJson('/api/mentor-feedback', [
                'user_profile_id' => $profileId,
                'recommendation' => 'Siap masuk tahap final review',
                'score' => 88,
                'notes' => 'Leadership dan evidence sudah kuat.',
            ])
            ->assertCreated();

        $feedbackId = DB::table('mentor_feedback')->value('id');

        $this->assertDatabaseHas('mentor_feedback', [
            'id' => $feedbackId,
            'user_profile_id' => $profileId,
            'score' => 88,
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$mentorToken}")
            ->patchJson("/api/mentor-feedback/{$feedbackId}", [
                'recommendation' => 'Siap direkomendasikan',
                'score' => 92,
                'notes' => 'Sudah konsisten dan siap naik level.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('mentor_feedback', [
            'id' => $feedbackId,
            'recommendation' => 'Siap direkomendasikan',
            'score' => 92,
        ]);

        $this
            ->withHeader('Authorization', "Bearer {$mentorToken}")
            ->deleteJson("/api/mentor-feedback/{$feedbackId}")
            ->assertOk();

        $this->assertDatabaseMissing('mentor_feedback', ['id' => $feedbackId]);
    }

    public function test_employee_cannot_manage_mentor_feedback(): void
    {
        $profileId = $this->profileFixture();
        $employeeToken = $this->tokenForRole('employee');

        $this
            ->withHeader('Authorization', "Bearer {$employeeToken}")
            ->postJson('/api/mentor-feedback', [
                'user_profile_id' => $profileId,
                'recommendation' => 'Tidak boleh',
                'score' => 90,
                'notes' => 'Tidak boleh.',
            ])
            ->assertForbidden();
    }

    private function profileFixture(): int
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Learner',
            'email' => 'learner-' . Str::random(6) . '@growtrack.test',
            'role' => 'employee',
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $goalId = DB::table('career_goals')->insertGetId([
            'audience' => 'employee',
            'title' => 'People Manager',
            'level' => 'Mid',
            'summary' => 'Track manager.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('user_profiles')->insertGetId([
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
