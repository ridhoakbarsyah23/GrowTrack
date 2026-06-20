<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PublicSummaryController extends Controller
{
    public function __invoke()
    {
        $careerGoals = DB::table('career_goals')
            ->leftJoin('roadmap_modules', 'career_goals.id', '=', 'roadmap_modules.career_goal_id')
            ->leftJoin('career_goal_skill', 'career_goals.id', '=', 'career_goal_skill.career_goal_id')
            ->select([
                'career_goals.id',
                'career_goals.audience',
                'career_goals.title',
                'career_goals.level',
                'career_goals.summary',
                DB::raw('COUNT(DISTINCT roadmap_modules.id) as module_count'),
                DB::raw('COALESCE(SUM(DISTINCT roadmap_modules.duration_hours), 0) as total_hours'),
                DB::raw('COUNT(DISTINCT career_goal_skill.skill_id) as skill_count'),
            ])
            ->groupBy('career_goals.id', 'career_goals.audience', 'career_goals.title', 'career_goals.level', 'career_goals.summary')
            ->orderByDesc('career_goals.updated_at')
            ->limit(6)
            ->get()
            ->map(fn ($goal) => [
                'id' => (int) $goal->id,
                'audience' => $goal->audience,
                'title' => $goal->title,
                'level' => $goal->level,
                'summary' => $goal->summary,
                'module_count' => (int) $goal->module_count,
                'total_hours' => (int) $goal->total_hours,
                'skill_count' => (int) $goal->skill_count,
            ]);

        $skillCategories = DB::table('skills')
            ->select([
                'category',
                DB::raw('COUNT(*) as skill_count'),
            ])
            ->groupBy('category')
            ->orderBy('category')
            ->get()
            ->map(fn ($category) => [
                'category' => $category->category,
                'skill_count' => (int) $category->skill_count,
            ]);

        $roadmapPreview = DB::table('roadmap_modules')
            ->join('career_goals', 'career_goals.id', '=', 'roadmap_modules.career_goal_id')
            ->select([
                'roadmap_modules.id',
                'career_goals.title as career_goal',
                'career_goals.audience',
                'roadmap_modules.sequence',
                'roadmap_modules.title',
                'roadmap_modules.module_type',
                'roadmap_modules.duration_hours',
                'roadmap_modules.outcome',
            ])
            ->orderByDesc('roadmap_modules.updated_at')
            ->orderBy('roadmap_modules.sequence')
            ->limit(6)
            ->get()
            ->map(fn ($module) => [
                'id' => (int) $module->id,
                'career_goal' => $module->career_goal,
                'audience' => $module->audience,
                'sequence' => (int) $module->sequence,
                'title' => $module->title,
                'module_type' => $module->module_type,
                'duration_hours' => (int) $module->duration_hours,
                'outcome' => $module->outcome,
            ]);

        $assessments = DB::table('assessment_templates')
            ->select(['id', 'audience', 'title', 'description', 'question_count'])
            ->orderByDesc('updated_at')
            ->limit(4)
            ->get()
            ->map(fn ($assessment) => [
                'id' => (int) $assessment->id,
                'audience' => $assessment->audience,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'question_count' => (int) $assessment->question_count,
            ]);

        $mentorFeedback = DB::table('mentor_feedback')
            ->join('users as mentors', 'mentors.id', '=', 'mentor_feedback.mentor_id')
            ->join('user_profiles', 'user_profiles.id', '=', 'mentor_feedback.user_profile_id')
            ->join('users as learners', 'learners.id', '=', 'user_profiles.user_id')
            ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
            ->select([
                'mentor_feedback.id',
                'mentors.name as mentor_name',
                'learners.name as learner_name',
                'career_goals.title as career_goal',
                'mentor_feedback.recommendation',
                'mentor_feedback.score',
                'mentor_feedback.notes',
                'mentor_feedback.updated_at',
            ])
            ->orderByDesc('mentor_feedback.updated_at')
            ->limit(3)
            ->get()
            ->map(fn ($feedback) => [
                'id' => (int) $feedback->id,
                'mentor_name' => $feedback->mentor_name,
                'learner_name' => $feedback->learner_name,
                'career_goal' => $feedback->career_goal,
                'recommendation' => $feedback->recommendation,
                'score' => (int) $feedback->score,
                'notes' => $feedback->notes,
                'updated_at' => $feedback->updated_at,
            ]);

        return response()->json([
            'career_goals' => DB::table('career_goals')->count(),
            'skills' => DB::table('skills')->count(),
            'assessment_templates' => DB::table('assessment_templates')->count(),
            'roadmap_modules' => DB::table('roadmap_modules')->count(),
            'active_profiles' => DB::table('user_profiles')->where('status', 'active')->count(),
            'career_goal_cards' => $careerGoals,
            'skill_categories' => $skillCategories,
            'roadmap_preview' => $roadmapPreview,
            'assessment_preview' => $assessments,
            'mentor_feedback' => $mentorFeedback,
            'updated_at' => now()->toISOString(),
        ]);
    }
}
