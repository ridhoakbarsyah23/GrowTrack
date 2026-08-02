<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class AdminController extends Controller
{
    private const LEARNER_ROLES = ['student', 'fresh_graduate', 'employee'];

    public function bootstrap(Request $request)
    {
        $admin = $this->admin($request);

        if (! $admin) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'settings' => [
                'manual_payment_instructions' => AppSettingsController::manualPaymentInstructions(),
            ],
            'users' => DB::table('users')
                ->select(['id', 'name', 'email', 'role', 'created_at'])
                ->orderBy('name')
                ->get(),
            'career_goals' => DB::table('career_goals')
                ->select(['id', 'audience', 'title', 'level', 'summary'])
                ->orderBy('title')
                ->get(),
            'skills' => DB::table('skills')
                ->select(['id', 'name', 'category', 'description'])
                ->orderBy('category')
                ->orderBy('name')
                ->get(),
            'assessment_templates' => DB::table('assessment_templates')
                ->select(['id', 'audience', 'title', 'description', 'question_count'])
                ->orderBy('title')
                ->get(),
            'roadmap_modules' => DB::table('roadmap_modules')
                ->join('career_goals', 'career_goals.id', '=', 'roadmap_modules.career_goal_id')
                ->leftJoin('skills', 'skills.id', '=', 'roadmap_modules.skill_id')
                ->select([
                    'roadmap_modules.id',
                    'roadmap_modules.career_goal_id',
                    'roadmap_modules.skill_id',
                    'career_goals.title as career_goal',
                    'skills.name as focus_skill',
                    'roadmap_modules.sequence',
                    'roadmap_modules.title',
                    'roadmap_modules.module_type',
                    'roadmap_modules.duration_hours',
                    'roadmap_modules.outcome',
                ])
                ->orderBy('career_goals.title')
                ->orderBy('roadmap_modules.sequence')
                ->get(),
            'skill_targets' => DB::table('career_goal_skill')
                ->join('career_goals', 'career_goals.id', '=', 'career_goal_skill.career_goal_id')
                ->join('skills', 'skills.id', '=', 'career_goal_skill.skill_id')
                ->select([
                    'career_goal_skill.id',
                    'career_goal_skill.career_goal_id',
                    'career_goals.title as career_goal',
                    'career_goal_skill.skill_id',
                    'skills.name as skill',
                    'career_goal_skill.target_score',
                ])
                ->orderBy('career_goals.title')
                ->orderBy('skills.name')
                ->get(),
            'assessment_questions' => DB::table('assessment_questions')
                ->join('assessment_templates', 'assessment_templates.id', '=', 'assessment_questions.assessment_template_id')
                ->join('skills', 'skills.id', '=', 'assessment_questions.skill_id')
                ->select([
                    'assessment_questions.id',
                    'assessment_questions.assessment_template_id',
                    'assessment_questions.skill_id',
                    'assessment_templates.title as assessment_template',
                    'skills.name as skill',
                    'assessment_questions.question',
                    'assessment_questions.weight',
                    'assessment_questions.max_score',
                ])
                ->orderBy('assessment_templates.title')
                ->orderBy('assessment_questions.id')
                ->get(),
            'learning_products' => DB::table('learning_products')
                ->select([
                    'id',
                    'type',
                    'title',
                    'slug',
                    'category',
                    'level',
                    'price',
                    'description',
                    'outcome',
                    'lesson_count',
                    'duration',
                    'scheduled_at',
                    'seat_limit',
                    'meeting_url',
                    'material_url',
                    'status',
                    'created_at',
                ])
                ->orderBy('type')
                ->orderBy('title')
                ->get(),
            'project_submissions' => DB::table('project_submissions')
                ->join('user_profiles', 'user_profiles.id', '=', 'project_submissions.user_profile_id')
                ->join('users as learners', 'learners.id', '=', 'user_profiles.user_id')
                ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
                ->join('roadmap_modules', 'roadmap_modules.id', '=', 'project_submissions.roadmap_module_id')
                ->leftJoin('users as reviewers', 'reviewers.id', '=', 'project_submissions.reviewer_id')
                ->select([
                    'project_submissions.id',
                    'project_submissions.user_profile_id',
                    'project_submissions.roadmap_module_id',
                    'project_submissions.title',
                    'project_submissions.description',
                    'project_submissions.status',
                    'project_submissions.score',
                    'project_submissions.review_notes',
                    'project_submissions.reviewed_at',
                    'project_submissions.created_at',
                    'learners.name as learner_name',
                    'learners.email as learner_email',
                    'career_goals.title as career_goal',
                    'roadmap_modules.title as module_title',
                    'reviewers.name as reviewer_name',
                ])
                ->orderByDesc('project_submissions.created_at')
                ->get(),
            'user_profiles' => DB::table('user_profiles')
                ->join('users', 'users.id', '=', 'user_profiles.user_id')
                ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
                ->select([
                    'user_profiles.id',
                    'users.name',
                    'users.email',
                    'user_profiles.role',
                    'user_profiles.education',
                    'user_profiles.current_position',
                    'user_profiles.experience_summary',
                    'user_profiles.self_reported_skills',
                    'user_profiles.interests',
                    'user_profiles.target_position',
                    'career_goals.title as career_goal',
                ])
                ->whereIn('user_profiles.role', self::LEARNER_ROLES)
                ->orderBy('users.name')
                ->get(),
            'mentor_feedback' => DB::table('mentor_feedback')
                ->join('user_profiles', 'user_profiles.id', '=', 'mentor_feedback.user_profile_id')
                ->join('users as learners', 'learners.id', '=', 'user_profiles.user_id')
                ->join('users as mentors', 'mentors.id', '=', 'mentor_feedback.mentor_id')
                ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
                ->select([
                    'mentor_feedback.id',
                    'mentor_feedback.user_profile_id',
                    'mentor_feedback.mentor_id',
                    'mentor_feedback.recommendation',
                    'mentor_feedback.score',
                    'mentor_feedback.notes',
                    'mentor_feedback.updated_at',
                    'learners.name as learner_name',
                    'learners.email as learner_email',
                    'career_goals.title as career_goal',
                    'mentors.name as mentor_name',
                ])
                ->orderByDesc('mentor_feedback.updated_at')
                ->get(),
        ]);
    }

    public function createUser(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'hr', 'mentor', ...self::LEARNER_ROLES])],
            'password' => ['required', 'string', 'min:8'],
            'career_goal_id' => ['nullable', 'exists:career_goals,id'],
            'education' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'current_position' => ['nullable', 'string', 'max:255'],
            'experience_summary' => ['nullable', 'string'],
            'self_reported_skills' => ['nullable', 'string'],
            'interests' => ['nullable', 'string'],
            'target_position' => ['nullable', 'string', 'max:255'],
        ]);

        $userId = DB::table('users')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! empty($validated['career_goal_id']) && in_array($validated['role'], self::LEARNER_ROLES, true)) {
            $profileId = DB::table('user_profiles')->insertGetId([
                'user_id' => $userId,
                'career_goal_id' => $validated['career_goal_id'],
                'role' => $validated['role'],
                'education' => $validated['education'] ?? null,
                'department' => $validated['department'] ?? null,
                'current_position' => $validated['current_position'] ?? null,
                'experience_summary' => $validated['experience_summary'] ?? null,
                'self_reported_skills' => $validated['self_reported_skills'] ?? null,
                'interests' => $validated['interests'] ?? null,
                'target_position' => $validated['target_position'] ?? 'Target Position',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->createInitialRoadmapProgress($profileId, (int) $validated['career_goal_id']);
        }

        return response()->json(['message' => 'User berhasil dibuat.', 'id' => $userId], Response::HTTP_CREATED);
    }

    public function createCareerGoal(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::LEARNER_ROLES)],
            'title' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string'],
        ]);

        $id = DB::table('career_goals')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Career goal berhasil dibuat.', 'id' => $id], Response::HTTP_CREATED);
    }

    public function updateCareerGoal(Request $request, int $careerGoal)
    {
        $record = DB::table('career_goals')->where('id', $careerGoal)->first();

        if (! $record) {
            return response()->json(['message' => 'Career goal tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::LEARNER_ROLES)],
            'title' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string'],
        ]);

        DB::table('career_goals')
            ->where('id', $careerGoal)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Career goal berhasil diperbarui.']);
    }

    public function deleteCareerGoal(int $careerGoal)
    {
        $record = DB::table('career_goals')->where('id', $careerGoal)->first();

        if (! $record) {
            return response()->json(['message' => 'Career goal tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        if ($this->careerGoalHasRelations($careerGoal)) {
            return response()->json([
                'message' => 'Career goal sudah dipakai profile, target skill, atau roadmap. Edit datanya atau hapus relasinya lebih dulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('career_goals')->where('id', $careerGoal)->delete();

        return response()->json(['message' => 'Career goal berhasil dihapus.']);
    }

    public function createSkill(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        $id = DB::table('skills')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Skill berhasil dibuat.', 'id' => $id], Response::HTTP_CREATED);
    }

    public function updateSkill(Request $request, int $skill)
    {
        $record = DB::table('skills')->where('id', $skill)->first();

        if (! $record) {
            return response()->json(['message' => 'Skill tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        DB::table('skills')
            ->where('id', $skill)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Skill berhasil diperbarui.']);
    }

    public function deleteSkill(int $skill)
    {
        $record = DB::table('skills')->where('id', $skill)->first();

        if (! $record) {
            return response()->json(['message' => 'Skill tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        if ($this->skillHasRelations($skill)) {
            return response()->json([
                'message' => 'Skill sudah dipakai target atau pertanyaan assessment. Hapus relasinya lebih dulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('skills')->where('id', $skill)->delete();

        return response()->json(['message' => 'Skill berhasil dihapus.']);
    }

    public function createAssessmentTemplate(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::LEARNER_ROLES)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'question_count' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $id = DB::table('assessment_templates')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Assessment template berhasil dibuat.', 'id' => $id], Response::HTTP_CREATED);
    }

    public function updateAssessmentTemplate(Request $request, int $assessmentTemplate)
    {
        $record = DB::table('assessment_templates')->where('id', $assessmentTemplate)->first();

        if (! $record) {
            return response()->json(['message' => 'Assessment template tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::LEARNER_ROLES)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'question_count' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        DB::table('assessment_templates')
            ->where('id', $assessmentTemplate)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Assessment template berhasil diperbarui.']);
    }

    public function deleteAssessmentTemplate(int $assessmentTemplate)
    {
        $record = DB::table('assessment_templates')->where('id', $assessmentTemplate)->first();

        if (! $record) {
            return response()->json(['message' => 'Assessment template tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        if ($this->assessmentTemplateHasRelations($assessmentTemplate)) {
            return response()->json([
                'message' => 'Assessment template sudah dipakai pertanyaan atau hasil assessment. Hapus relasinya lebih dulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('assessment_templates')->where('id', $assessmentTemplate)->delete();

        return response()->json(['message' => 'Assessment template berhasil dihapus.']);
    }

    public function createRoadmapModule(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'career_goal_id' => ['required', 'exists:career_goals,id'],
            'skill_id' => ['nullable', 'exists:skills,id'],
            'sequence' => ['required', 'integer', 'min:1', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'module_type' => ['required', 'string', 'max:255'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:255'],
            'outcome' => ['required', 'string'],
        ]);

        $id = DB::table('roadmap_modules')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Roadmap module berhasil dibuat.', 'id' => $id], Response::HTTP_CREATED);
    }

    public function updateRoadmapModule(Request $request, int $roadmapModule)
    {
        $record = DB::table('roadmap_modules')->where('id', $roadmapModule)->first();

        if (! $record) {
            return response()->json(['message' => 'Roadmap module tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'career_goal_id' => ['required', 'exists:career_goals,id'],
            'skill_id' => ['nullable', 'exists:skills,id'],
            'sequence' => ['required', 'integer', 'min:1', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'module_type' => ['required', 'string', 'max:255'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:255'],
            'outcome' => ['required', 'string'],
        ]);

        DB::table('roadmap_modules')
            ->where('id', $roadmapModule)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Roadmap module berhasil diperbarui.']);
    }

    public function deleteRoadmapModule(int $roadmapModule)
    {
        $record = DB::table('roadmap_modules')->where('id', $roadmapModule)->first();

        if (! $record) {
            return response()->json(['message' => 'Roadmap module tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        if ($this->roadmapModuleHasRelations($roadmapModule)) {
            return response()->json([
                'message' => 'Roadmap module sudah punya progress atau submission. Edit datanya atau hapus relasinya lebih dulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('roadmap_modules')->where('id', $roadmapModule)->delete();

        return response()->json(['message' => 'Roadmap module berhasil dihapus.']);
    }

    public function upsertSkillTarget(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'career_goal_id' => ['required', 'exists:career_goals,id'],
            'skill_id' => ['required', 'exists:skills,id'],
            'target_score' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        DB::table('career_goal_skill')->updateOrInsert(
            [
                'career_goal_id' => $validated['career_goal_id'],
                'skill_id' => $validated['skill_id'],
            ],
            [
                'target_score' => $validated['target_score'],
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return response()->json(['message' => 'Target skill berhasil disimpan.'], Response::HTTP_CREATED);
    }

    public function updateSkillTarget(Request $request, int $skillTarget)
    {
        $record = DB::table('career_goal_skill')->where('id', $skillTarget)->first();

        if (! $record) {
            return response()->json(['message' => 'Target skill tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'career_goal_id' => ['required', 'exists:career_goals,id'],
            'skill_id' => ['required', 'exists:skills,id'],
            'target_score' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $duplicate = DB::table('career_goal_skill')
            ->where('career_goal_id', $validated['career_goal_id'])
            ->where('skill_id', $validated['skill_id'])
            ->where('id', '!=', $skillTarget)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Kombinasi career goal dan skill sudah punya target.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('career_goal_skill')
            ->where('id', $skillTarget)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Target skill berhasil diperbarui.']);
    }

    public function deleteSkillTarget(int $skillTarget)
    {
        $record = DB::table('career_goal_skill')->where('id', $skillTarget)->first();

        if (! $record) {
            return response()->json(['message' => 'Target skill tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        DB::table('career_goal_skill')->where('id', $skillTarget)->delete();

        return response()->json(['message' => 'Target skill berhasil dihapus.']);
    }

    public function createAssessmentQuestion(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'assessment_template_id' => ['required', 'exists:assessment_templates,id'],
            'skill_id' => ['required', 'exists:skills,id'],
            'question' => ['required', 'string'],
            'weight' => ['required', 'integer', 'min:1', 'max:10'],
            'max_score' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $id = DB::table('assessment_questions')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Pertanyaan assessment berhasil dibuat.', 'id' => $id], Response::HTTP_CREATED);
    }

    public function updateAssessmentQuestion(Request $request, int $assessmentQuestion)
    {
        $record = DB::table('assessment_questions')->where('id', $assessmentQuestion)->first();

        if (! $record) {
            return response()->json(['message' => 'Pertanyaan assessment tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'assessment_template_id' => ['required', 'exists:assessment_templates,id'],
            'skill_id' => ['required', 'exists:skills,id'],
            'question' => ['required', 'string'],
            'weight' => ['required', 'integer', 'min:1', 'max:10'],
            'max_score' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        DB::table('assessment_questions')
            ->where('id', $assessmentQuestion)
            ->update([...$validated, 'updated_at' => now()]);

        return response()->json(['message' => 'Pertanyaan assessment berhasil diperbarui.']);
    }

    public function deleteAssessmentQuestion(int $assessmentQuestion)
    {
        $record = DB::table('assessment_questions')->where('id', $assessmentQuestion)->first();

        if (! $record) {
            return response()->json(['message' => 'Pertanyaan assessment tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        DB::table('assessment_questions')->where('id', $assessmentQuestion)->delete();

        return response()->json(['message' => 'Pertanyaan assessment berhasil dihapus.']);
    }

    private function admin(Request $request): ?object
    {
        $user = ApiToken::user($request);

        return $user && $user->role === 'admin' ? $user : null;
    }

    private function createInitialRoadmapProgress(int $profileId, int $careerGoalId): void
    {
        $now = now();
        $modules = DB::table('roadmap_modules')
            ->where('career_goal_id', $careerGoalId)
            ->orderBy('sequence')
            ->get(['id']);

        foreach ($modules as $module) {
            DB::table('roadmap_progress')->updateOrInsert(
                [
                    'user_profile_id' => $profileId,
                    'roadmap_module_id' => $module->id,
                ],
                [
                    'status' => 'not_started',
                    'progress_percent' => 0,
                    'due_date' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function careerGoalHasRelations(int $careerGoal): bool
    {
        return DB::table('user_profiles')->where('career_goal_id', $careerGoal)->exists()
            || DB::table('career_goal_skill')->where('career_goal_id', $careerGoal)->exists()
            || DB::table('roadmap_modules')->where('career_goal_id', $careerGoal)->exists();
    }

    private function skillHasRelations(int $skill): bool
    {
        return DB::table('career_goal_skill')->where('skill_id', $skill)->exists()
            || DB::table('assessment_questions')->where('skill_id', $skill)->exists();
    }

    private function assessmentTemplateHasRelations(int $assessmentTemplate): bool
    {
        return DB::table('assessment_questions')->where('assessment_template_id', $assessmentTemplate)->exists()
            || DB::table('assessment_results')->where('assessment_template_id', $assessmentTemplate)->exists();
    }

    private function roadmapModuleHasRelations(int $roadmapModule): bool
    {
        return DB::table('roadmap_progress')->where('roadmap_module_id', $roadmapModule)->exists()
            || DB::table('project_submissions')->where('roadmap_module_id', $roadmapModule)->exists();
    }
}
