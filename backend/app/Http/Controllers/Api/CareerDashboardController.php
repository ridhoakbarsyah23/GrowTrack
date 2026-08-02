<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use App\Support\SkillGapAnalysis;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CareerDashboardController extends Controller
{
    private const LEARNER_ROLES = ['student', 'fresh_graduate', 'employee'];

    public function __invoke(Request $request)
    {
        $currentUser = ApiToken::user($request);

        if (! $currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $goals = DB::table('career_goals')
            ->leftJoin('roadmap_modules', 'career_goals.id', '=', 'roadmap_modules.career_goal_id')
            ->select([
                'career_goals.id',
                'career_goals.audience',
                'career_goals.title',
                'career_goals.level',
                'career_goals.summary',
                DB::raw('COUNT(roadmap_modules.id) as module_count'),
                DB::raw('COALESCE(SUM(roadmap_modules.duration_hours), 0) as total_hours'),
            ])
            ->groupBy('career_goals.id', 'career_goals.audience', 'career_goals.title', 'career_goals.level', 'career_goals.summary')
            ->orderBy('career_goals.audience')
            ->orderBy('career_goals.title')
            ->get();

        $skills = DB::table('skills')
            ->select(['id', 'name', 'category', 'description'])
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $roadmap = DB::table('roadmap_modules')
            ->join('career_goals', 'career_goals.id', '=', 'roadmap_modules.career_goal_id')
            ->leftJoin('skills', 'skills.id', '=', 'roadmap_modules.skill_id')
            ->select([
                'roadmap_modules.id',
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
            ->get();

        $assessments = DB::table('assessment_templates')
            ->select(['id', 'audience', 'title', 'description', 'question_count'])
            ->orderBy('audience')
            ->get();

        $profileQuery = DB::table('user_profiles')
            ->join('users', 'users.id', '=', 'user_profiles.user_id')
            ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
            ->leftJoin('assessment_results', 'assessment_results.user_profile_id', '=', 'user_profiles.id')
            ->leftJoin('mentor_feedback', 'mentor_feedback.user_profile_id', '=', 'user_profiles.id')
            ->select([
                'user_profiles.id',
                'user_profiles.career_goal_id',
                'users.name',
                'users.email',
                'user_profiles.role',
                'user_profiles.education',
                'user_profiles.department',
                'user_profiles.current_position',
                'user_profiles.experience_summary',
                'user_profiles.self_reported_skills',
                'user_profiles.interests',
                'user_profiles.target_position',
                'career_goals.title as career_goal',
                'assessment_results.overall_score',
                'assessment_results.skill_scores',
                'assessment_results.summary as assessment_summary',
                'mentor_feedback.recommendation',
                'mentor_feedback.score as mentor_score',
                'mentor_feedback.notes as mentor_notes',
            ])
            ->orderBy('user_profiles.role');

        if (in_array($currentUser->role, self::LEARNER_ROLES, true)) {
            $profileQuery->where('user_profiles.user_id', $currentUser->id);
        }

        $users = $profileQuery->get()
            ->map(fn ($profile) => $this->buildProfile($profile));

        return response()->json([
            'current_user' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'role' => $currentUser->role,
            ],
            'goals' => $goals,
            'skills' => $skills,
            'roadmap' => $roadmap,
            'assessments' => $assessments,
            'profiles' => $users,
            'hr_summary' => [
                'total_active_profiles' => $users->count(),
                'ready_or_almost_ready' => $users->filter(fn ($user) => $user['readiness_score'] >= 75)->count(),
                'average_readiness' => round($users->avg('readiness_score') ?? 0),
                'highest_gap' => $this->highestGap($users),
            ],
        ]);
    }

    private function buildProfile(object $profile): array
    {
        $this->ensureRoadmapProgress($profile);
        $skillScores = collect(json_decode($profile->skill_scores ?: '{}', true));
        $skillGapAnalysis = SkillGapAnalysis::forProfile((int) $profile->id, $skillScores);

        $progress = DB::table('roadmap_progress')
            ->join('roadmap_modules', 'roadmap_modules.id', '=', 'roadmap_progress.roadmap_module_id')
            ->leftJoin('skills', 'skills.id', '=', 'roadmap_modules.skill_id')
            ->where('roadmap_progress.user_profile_id', $profile->id)
            ->select([
                'roadmap_progress.id',
                'roadmap_progress.roadmap_module_id',
                'roadmap_modules.sequence',
                'roadmap_modules.title',
                'roadmap_modules.module_type',
                'roadmap_modules.duration_hours',
                'roadmap_modules.outcome',
                'skills.name as focus_skill',
                'roadmap_progress.status',
                'roadmap_progress.progress_percent',
                'roadmap_progress.due_date',
            ])
            ->orderBy('roadmap_modules.sequence')
            ->get()
            ->map(fn ($item) => $this->personalizeRoadmapItem($item, $skillGapAnalysis['items']))
            ->sortBy([
                ['priority_rank', 'desc'],
                ['sequence', 'asc'],
            ])
            ->values()
            ->map(function (array $item, int $index) {
                $item['recommended_order'] = $index + 1;

                return $item;
            });

        $submissions = DB::table('project_submissions')
            ->join('roadmap_modules', 'roadmap_modules.id', '=', 'project_submissions.roadmap_module_id')
            ->where('project_submissions.user_profile_id', $profile->id)
            ->select([
                'project_submissions.id',
                'project_submissions.roadmap_module_id',
                'project_submissions.title',
                'roadmap_modules.title as module_title',
                'project_submissions.description',
                'project_submissions.status',
                'project_submissions.score',
                'project_submissions.created_at',
            ])
            ->orderByDesc('project_submissions.created_at')
            ->get();

        $assessmentScore = (int) ($profile->overall_score ?? 0);
        $roadmapProgress = round($progress->avg('progress_percent') ?? 0);
        $projectEvidence = round($submissions->avg('score') ?? 0);
        $mentorScore = (int) ($profile->mentor_score ?? 0);
        $readinessScore = round(
            ($assessmentScore * 0.4) +
            ($roadmapProgress * 0.3) +
            ($projectEvidence * 0.2) +
            ($mentorScore * 0.1)
        );

        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'email' => $profile->email,
            'role' => $profile->role,
            'education' => $profile->education,
            'department' => $profile->department,
            'current_position' => $profile->current_position,
            'experience_summary' => $profile->experience_summary,
            'self_reported_skills' => $profile->self_reported_skills,
            'interests' => $profile->interests,
            'target_position' => $profile->target_position,
            'career_goal' => $profile->career_goal,
            'assessment' => [
                'overall_score' => $assessmentScore,
                'summary' => $profile->assessment_summary,
                'skill_scores' => $skillScores,
                'skill_gaps' => $skillGapAnalysis['items'],
                'skill_gap_summary' => $skillGapAnalysis['summary'],
            ],
            'roadmap_progress_score' => $roadmapProgress,
            'project_evidence_score' => $projectEvidence,
            'mentor_feedback_score' => $mentorScore,
            'readiness_score' => $readinessScore,
            'readiness_status' => $this->readinessStatus($readinessScore),
            'roadmap_progress' => $progress,
            'submissions' => $submissions,
            'mentor_feedback' => [
                'recommendation' => $profile->recommendation,
                'score' => $mentorScore,
                'notes' => $profile->mentor_notes,
            ],
        ];
    }

    private function readinessStatus(int $score): string
    {
        return match (true) {
            $score >= 85 => 'Siap direkomendasikan',
            $score >= 75 => 'Hampir siap',
            $score >= 60 => 'Perlu development',
            default => 'Belum siap',
        };
    }

    private function ensureRoadmapProgress(object $profile): void
    {
        $now = now();
        $existingModuleIds = DB::table('roadmap_progress')
            ->where('user_profile_id', $profile->id)
            ->pluck('roadmap_module_id')
            ->all();

        $modules = DB::table('roadmap_modules')
            ->where('career_goal_id', $profile->career_goal_id)
            ->whereNotIn('id', $existingModuleIds)
            ->get(['id']);

        foreach ($modules as $module) {
            DB::table('roadmap_progress')->insert([
                'user_profile_id' => $profile->id,
                'roadmap_module_id' => $module->id,
                'status' => 'not_started',
                'progress_percent' => 0,
                'due_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function highestGap(Collection $users): ?array
    {
        return $users
            ->flatMap(fn ($user) => $user['assessment']['skill_gaps'])
            ->sortByDesc('gap')
            ->first();
    }

    private function personalizeRoadmapItem(object $item, Collection $skillGaps): array
    {
        $matchedGap = $this->matchedGap($item, $skillGaps);
        $gapValue = (int) ($matchedGap['gap'] ?? 0);

        return [
            'id' => $item->id,
            'roadmap_module_id' => $item->roadmap_module_id,
            'sequence' => $item->sequence,
            'title' => $item->title,
            'module_type' => $item->module_type,
            'duration_hours' => $item->duration_hours,
            'outcome' => $item->outcome,
            'focus_skill' => $item->focus_skill,
            'status' => $item->status,
            'progress_percent' => $item->progress_percent,
            'due_date' => $item->due_date,
            'related_gap' => $matchedGap,
            'priority_rank' => $gapValue,
            'priority_reason' => $matchedGap
                ? "Diprioritaskan karena gap {$matchedGap['skill']} masih {$gapValue} poin."
                : 'Urutan mengikuti roadmap dasar career goal.',
        ];
    }

    private function matchedGap(object $item, Collection $skillGaps): ?array
    {
        if ($item->focus_skill) {
            return $skillGaps->firstWhere('skill', $item->focus_skill);
        }

        $haystack = strtolower("{$item->title} {$item->outcome} {$item->module_type}");

        return $skillGaps->first(function (array $gap) use ($haystack) {
            return str_contains($haystack, strtolower($gap['skill']));
        });
    }
}
