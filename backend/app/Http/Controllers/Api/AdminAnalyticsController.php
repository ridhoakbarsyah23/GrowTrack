<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AdminAnalyticsController extends Controller
{
    public function __invoke(Request $request)
    {
        $admin = ApiToken::user($request);

        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        $orderSummary = DB::table('learning_orders')
            ->select('status', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(amount), 0) as revenue'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $productSummary = DB::table('learning_products')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $profileSummary = DB::table('user_profiles')
            ->select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        $assessmentCount = DB::table('assessment_results')->count();
        $submissionSummary = DB::table('project_submissions')
            ->select('status', DB::raw('COUNT(*) as total'), DB::raw('ROUND(COALESCE(AVG(score), 0)) as average_score'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $topSkillTargets = DB::table('career_goal_skill')
            ->join('skills', 'skills.id', '=', 'career_goal_skill.skill_id')
            ->select('skills.name', 'skills.category', DB::raw('COUNT(*) as career_goal_count'), DB::raw('ROUND(AVG(career_goal_skill.target_score)) as average_target'))
            ->groupBy('skills.id', 'skills.name', 'skills.category')
            ->orderByDesc('career_goal_count')
            ->orderByDesc('average_target')
            ->limit(6)
            ->get()
            ->map(fn ($skill) => [
                'name' => $skill->name,
                'category' => $skill->category,
                'career_goal_count' => (int) $skill->career_goal_count,
                'average_target' => (int) $skill->average_target,
            ]);

        return response()->json([
            'users' => [
                'total' => DB::table('users')->count(),
                'learners' => DB::table('users')->whereIn('role', ['student', 'fresh_graduate', 'employee'])->count(),
                'admins' => DB::table('users')->where('role', 'admin')->count(),
                'mentors' => DB::table('users')->where('role', 'mentor')->count(),
            ],
            'profiles' => [
                'total' => DB::table('user_profiles')->count(),
                'by_role' => $profileSummary,
            ],
            'assessment' => [
                'results' => $assessmentCount,
                'templates' => DB::table('assessment_templates')->count(),
                'questions' => DB::table('assessment_questions')->count(),
            ],
            'roadmap' => [
                'modules' => DB::table('roadmap_modules')->count(),
                'progress_items' => DB::table('roadmap_progress')->count(),
                'completed_items' => DB::table('roadmap_progress')->where('status', 'completed')->count(),
            ],
            'products' => [
                'draft' => (int) ($productSummary['draft'] ?? 0),
                'active' => (int) ($productSummary['active'] ?? 0),
                'inactive' => (int) ($productSummary['inactive'] ?? 0),
            ],
            'orders' => [
                'pending' => [
                    'count' => (int) ($orderSummary['pending']->total ?? 0),
                    'revenue' => (int) ($orderSummary['pending']->revenue ?? 0),
                ],
                'paid' => [
                    'count' => (int) ($orderSummary['paid']->total ?? 0),
                    'revenue' => (int) ($orderSummary['paid']->revenue ?? 0),
                ],
                'cancelled' => [
                    'count' => (int) ($orderSummary['cancelled']->total ?? 0),
                    'revenue' => (int) ($orderSummary['cancelled']->revenue ?? 0),
                ],
            ],
            'evidence' => [
                'submitted' => [
                    'count' => (int) ($submissionSummary['submitted']->total ?? 0),
                    'average_score' => (int) ($submissionSummary['submitted']->average_score ?? 0),
                ],
                'reviewed' => [
                    'count' => (int) ($submissionSummary['reviewed']->total ?? 0),
                    'average_score' => (int) ($submissionSummary['reviewed']->average_score ?? 0),
                ],
                'revision_needed' => [
                    'count' => (int) ($submissionSummary['revision_needed']->total ?? 0),
                    'average_score' => (int) ($submissionSummary['revision_needed']->average_score ?? 0),
                ],
            ],
            'top_skill_targets' => $topSkillTargets,
            'updated_at' => now()->toISOString(),
        ]);
    }
}
