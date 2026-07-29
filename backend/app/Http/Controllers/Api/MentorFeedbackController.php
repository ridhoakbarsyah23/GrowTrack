<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class MentorFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $reviewer = ApiToken::user($request);

        if (! $this->canReview($reviewer)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'profiles' => $this->profileOptions(),
            'feedback' => $this->feedbackList(),
        ]);
    }

    public function store(Request $request)
    {
        $reviewer = ApiToken::user($request);

        if (! $this->canReview($reviewer)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'user_profile_id' => ['required', 'exists:user_profiles,id'],
            'recommendation' => ['required', 'string', 'max:255'],
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'notes' => ['required', 'string'],
        ]);

        DB::table('mentor_feedback')->updateOrInsert(
            ['user_profile_id' => $validated['user_profile_id']],
            [
                'mentor_id' => $reviewer->id,
                'recommendation' => $validated['recommendation'],
                'score' => $validated['score'],
                'notes' => $validated['notes'],
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return response()->json(['message' => 'Feedback mentor berhasil disimpan.'], Response::HTTP_CREATED);
    }

    public function update(Request $request, int $feedback)
    {
        $reviewer = ApiToken::user($request);

        if (! $this->canReview($reviewer)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        $record = DB::table('mentor_feedback')->where('id', $feedback)->first();

        if (! $record) {
            return response()->json(['message' => 'Feedback mentor tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'recommendation' => ['required', 'string', 'max:255'],
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'notes' => ['required', 'string'],
        ]);

        DB::table('mentor_feedback')
            ->where('id', $feedback)
            ->update([
                'mentor_id' => $reviewer->id,
                'recommendation' => $validated['recommendation'],
                'score' => $validated['score'],
                'notes' => $validated['notes'],
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Feedback mentor berhasil diperbarui.']);
    }

    public function destroy(Request $request, int $feedback)
    {
        $reviewer = ApiToken::user($request);

        if (! $this->canReview($reviewer)) {
            return response()->json(['message' => 'Admin or mentor access required.'], Response::HTTP_FORBIDDEN);
        }

        $record = DB::table('mentor_feedback')->where('id', $feedback)->first();

        if (! $record) {
            return response()->json(['message' => 'Feedback mentor tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        DB::table('mentor_feedback')->where('id', $feedback)->delete();

        return response()->json(['message' => 'Feedback mentor berhasil dihapus.']);
    }

    private function canReview(?object $user): bool
    {
        return $user && in_array($user->role, ['admin', 'mentor'], true);
    }

    private function profileOptions()
    {
        return DB::table('user_profiles')
            ->join('users', 'users.id', '=', 'user_profiles.user_id')
            ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
            ->select([
                'user_profiles.id',
                'users.name',
                'users.email',
                'user_profiles.role',
                'user_profiles.current_position',
                'user_profiles.target_position',
                'career_goals.title as career_goal',
            ])
            ->whereIn('user_profiles.role', ['employee', 'fresh_graduate'])
            ->orderBy('users.name')
            ->get();
    }

    private function feedbackList()
    {
        return DB::table('mentor_feedback')
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
            ->get();
    }
}
