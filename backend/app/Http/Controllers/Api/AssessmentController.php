<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AssessmentController extends Controller
{
    public function current(Request $request)
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $profile = $this->profileForUser((int) $user->id);

        if (! $profile) {
            return response()->json(['message' => 'Profile karir belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $template = DB::table('assessment_templates')
            ->where('audience', $profile->role)
            ->orderBy('id')
            ->first();

        if (! $template) {
            return response()->json(['message' => 'Assessment template belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $questions = DB::table('assessment_questions')
            ->join('skills', 'skills.id', '=', 'assessment_questions.skill_id')
            ->where('assessment_questions.assessment_template_id', $template->id)
            ->select([
                'assessment_questions.id',
                'assessment_questions.question',
                'assessment_questions.weight',
                'assessment_questions.max_score',
                'skills.id as skill_id',
                'skills.name as skill',
                'skills.category as skill_category',
            ])
            ->orderBy('assessment_questions.id')
            ->get();

        return response()->json([
            'profile' => [
                'id' => $profile->id,
                'career_goal' => $profile->career_goal,
                'current_position' => $profile->current_position,
                'target_position' => $profile->target_position,
            ],
            'template' => [
                'id' => $template->id,
                'title' => $template->title,
                'description' => $template->description,
                'question_count' => $template->question_count,
            ],
            'questions' => $questions,
        ]);
    }

    public function submit(Request $request)
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $validated = $request->validate([
            'assessment_template_id' => ['required', 'exists:assessment_templates,id'],
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'exists:assessment_questions,id'],
            'answers.*.score' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $profile = $this->profileForUser((int) $user->id);

        if (! $profile) {
            return response()->json(['message' => 'Profile karir belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $questions = DB::table('assessment_questions')
            ->join('skills', 'skills.id', '=', 'assessment_questions.skill_id')
            ->where('assessment_questions.assessment_template_id', $validated['assessment_template_id'])
            ->select([
                'assessment_questions.id',
                'assessment_questions.weight',
                'assessment_questions.max_score',
                'skills.name as skill',
            ])
            ->get()
            ->keyBy('id');

        $answers = collect($validated['answers'])->keyBy('question_id');
        $skillBuckets = [];

        foreach ($questions as $question) {
            $answer = $answers->get($question->id);

            if (! $answer) {
                continue;
            }

            $score = min((int) $answer['score'], (int) $question->max_score);
            $weightedScore = ($score / (int) $question->max_score) * 100 * (int) $question->weight;

            $skillBuckets[$question->skill] ??= ['score' => 0, 'weight' => 0];
            $skillBuckets[$question->skill]['score'] += $weightedScore;
            $skillBuckets[$question->skill]['weight'] += (int) $question->weight;
        }

        if (! count($skillBuckets)) {
            return response()->json(['message' => 'Tidak ada jawaban yang cocok dengan pertanyaan.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $skillScores = collect($skillBuckets)->mapWithKeys(function (array $bucket, string $skill) {
            return [$skill => round($bucket['score'] / max($bucket['weight'], 1))];
        });
        $overallScore = round($skillScores->avg() ?? 0);
        $lowestSkill = $skillScores->sort()->keys()->first();
        $summary = $lowestSkill
            ? "Assessment selesai. Area prioritas pengembangan saat ini adalah {$lowestSkill}."
            : 'Assessment selesai.';

        DB::table('assessment_results')->updateOrInsert(
            [
                'user_profile_id' => $profile->id,
                'assessment_template_id' => $validated['assessment_template_id'],
            ],
            [
                'overall_score' => $overallScore,
                'skill_scores' => json_encode($skillScores->all()),
                'summary' => $summary,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Assessment berhasil disimpan.',
            'overall_score' => $overallScore,
            'skill_scores' => $skillScores,
            'summary' => $summary,
        ]);
    }

    private function profileForUser(int $userId): ?object
    {
        return DB::table('user_profiles')
            ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
            ->where('user_profiles.user_id', $userId)
            ->select([
                'user_profiles.id',
                'user_profiles.role',
                'user_profiles.current_position',
                'user_profiles.target_position',
                'career_goals.title as career_goal',
            ])
            ->first();
    }
}
