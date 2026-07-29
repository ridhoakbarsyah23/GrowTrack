<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class UserJourneyController extends Controller
{
    public function reviewQueue(Request $request)
    {
        $reviewer = ApiToken::user($request);

        if (! in_array($reviewer->role, ['admin', 'mentor'], true)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'submissions' => $this->reviewSubmissions(),
        ]);
    }

    public function updateProgress(Request $request, int $progress)
    {
        $user = ApiToken::user($request);
        $profile = $this->profileForUser((int) $user->id);

        if (! $profile) {
            return response()->json(['message' => 'Profile karir belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $record = DB::table('roadmap_progress')
            ->where('id', $progress)
            ->where('user_profile_id', $profile->id)
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Progress roadmap tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['not_started', 'in_progress', 'completed'])],
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'due_date' => ['nullable', 'date'],
        ]);

        DB::table('roadmap_progress')
            ->where('id', $progress)
            ->update([
                'status' => $validated['status'],
                'progress_percent' => $validated['progress_percent'],
                'due_date' => $validated['due_date'] ?? null,
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Progress roadmap berhasil diperbarui.']);
    }

    public function submitProject(Request $request)
    {
        $user = ApiToken::user($request);
        $profile = $this->profileForUser((int) $user->id);

        if (! $profile) {
            return response()->json(['message' => 'Profile karir belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'roadmap_progress_id' => ['required', 'exists:roadmap_progress,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        $progress = DB::table('roadmap_progress')
            ->join('roadmap_modules', 'roadmap_modules.id', '=', 'roadmap_progress.roadmap_module_id')
            ->where('roadmap_progress.id', $validated['roadmap_progress_id'])
            ->where('roadmap_progress.user_profile_id', $profile->id)
            ->where('roadmap_modules.career_goal_id', $profile->career_goal_id)
            ->select([
                'roadmap_progress.id',
                'roadmap_progress.roadmap_module_id',
            ])
            ->first();

        if (! $progress) {
            return response()->json(['message' => 'Roadmap module tidak sesuai dengan profile kamu.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $submissionId = DB::table('project_submissions')->insertGetId([
            'user_profile_id' => $profile->id,
            'roadmap_module_id' => $progress->roadmap_module_id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'submitted',
            'score' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('roadmap_progress')
            ->where('id', $progress->id)
            ->update([
                'status' => 'completed',
                'progress_percent' => 100,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Project evidence berhasil dikirim.',
            'submission_id' => $submissionId,
        ], Response::HTTP_CREATED);
    }

    public function reviewProject(Request $request, int $submission)
    {
        $reviewer = ApiToken::user($request);

        if (! in_array($reviewer->role, ['admin', 'mentor'], true)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        $record = DB::table('project_submissions')->where('id', $submission)->first();

        if (! $record) {
            return response()->json(['message' => 'Project evidence tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['submitted', 'reviewed', 'revision_needed'])],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validated['status'] === 'reviewed' && $validated['score'] === null) {
            return response()->json([
                'message' => 'Score wajib diisi saat evidence ditandai reviewed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('project_submissions')
            ->where('id', $submission)
            ->update([
                'status' => $validated['status'],
                'score' => $validated['score'] ?? null,
                'review_notes' => $validated['review_notes'] ?? null,
                'reviewer_id' => $reviewer->id,
                'reviewed_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Project evidence berhasil direview.']);
    }

    private function profileForUser(int $userId): ?object
    {
        return DB::table('user_profiles')
            ->where('user_id', $userId)
            ->select(['id', 'career_goal_id'])
            ->first();
    }

    private function reviewSubmissions()
    {
        return DB::table('project_submissions')
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
            ->get();
    }
}
