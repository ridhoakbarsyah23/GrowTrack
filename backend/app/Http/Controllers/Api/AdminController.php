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
    public function bootstrap(Request $request)
    {
        $admin = $this->admin($request);

        if (! $admin) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
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
                ->select([
                    'roadmap_modules.id',
                    'roadmap_modules.career_goal_id',
                    'career_goals.title as career_goal',
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
                    'assessment_templates.title as assessment_template',
                    'skills.name as skill',
                    'assessment_questions.question',
                    'assessment_questions.weight',
                    'assessment_questions.max_score',
                ])
                ->orderBy('assessment_templates.title')
                ->orderBy('assessment_questions.id')
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
            'role' => ['required', Rule::in(['admin', 'hr', 'mentor', 'employee', 'fresh_graduate'])],
            'password' => ['required', 'string', 'min:8'],
            'career_goal_id' => ['nullable', 'exists:career_goals,id'],
            'department' => ['nullable', 'string', 'max:255'],
            'current_position' => ['nullable', 'string', 'max:255'],
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

        if (! empty($validated['career_goal_id']) && in_array($validated['role'], ['employee', 'fresh_graduate'], true)) {
            $profileId = DB::table('user_profiles')->insertGetId([
                'user_id' => $userId,
                'career_goal_id' => $validated['career_goal_id'],
                'role' => $validated['role'],
                'department' => $validated['department'] ?? null,
                'current_position' => $validated['current_position'] ?? null,
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
            'audience' => ['required', Rule::in(['employee', 'fresh_graduate'])],
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

    public function createAssessmentTemplate(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'audience' => ['required', Rule::in(['employee', 'fresh_graduate'])],
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

    public function createRoadmapModule(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'career_goal_id' => ['required', 'exists:career_goals,id'],
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
}
