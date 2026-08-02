<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SkillGapAnalysis
{
    private const DEFAULT_TARGET_SCORE = 80;

    public static function forProfile(int $profileId, Collection $skillScores): array
    {
        $targetSkills = DB::table('career_goal_skill')
            ->join('skills', 'skills.id', '=', 'career_goal_skill.skill_id')
            ->join('user_profiles', 'user_profiles.career_goal_id', '=', 'career_goal_skill.career_goal_id')
            ->where('user_profiles.id', $profileId)
            ->select([
                'skills.name',
                'skills.category',
                'skills.description',
                'career_goal_skill.target_score',
            ])
            ->orderBy('skills.category')
            ->orderBy('skills.name')
            ->get();

        $targetSource = 'configured';

        if ($targetSkills->isEmpty()) {
            $targetSource = 'assessment_default';
            $scoreNames = $skillScores->keys()->all();

            $targetSkills = DB::table('skills')
                ->whereIn('name', $scoreNames)
                ->select([
                    'name',
                    'category',
                    'description',
                    DB::raw(self::DEFAULT_TARGET_SCORE . ' as target_score'),
                ])
                ->orderBy('category')
                ->orderBy('name')
                ->get();
        }

        $gaps = $targetSkills->map(function ($skill) use ($skillScores, $targetSource) {
            $current = (int) ($skillScores[$skill->name] ?? 0);
            $target = (int) $skill->target_score;
            $gap = max($target - $current, 0);

            return [
                'skill' => $skill->name,
                'category' => $skill->category,
                'description' => $skill->description,
                'current_score' => $current,
                'target_score' => $target,
                'gap' => $gap,
                'status' => self::status($gap),
                'severity' => self::severity($gap),
                'recommendation' => self::recommendation($skill->name, $gap),
                'target_source' => $targetSource,
            ];
        })->sortByDesc('gap')->values();

        return [
            'items' => $gaps,
            'summary' => [
                'total_skills' => $gaps->count(),
                'met_target' => $gaps->where('gap', 0)->count(),
                'priority_count' => $gaps->where('gap', '>=', 20)->count(),
                'average_gap' => round($gaps->avg('gap') ?? 0),
                'highest_gap' => $gaps->first(),
                'target_source' => $targetSource,
                'default_target_score' => $targetSource === 'assessment_default' ? self::DEFAULT_TARGET_SCORE : null,
            ],
        ];
    }

    private static function status(int $gap): string
    {
        return match (true) {
            $gap === 0 => 'target_met',
            $gap <= 10 => 'near_target',
            $gap <= 25 => 'needs_practice',
            default => 'critical_gap',
        };
    }

    private static function severity(int $gap): string
    {
        return match (true) {
            $gap === 0 => 'Sudah memenuhi target',
            $gap <= 10 => 'Hampir memenuhi target',
            $gap <= 25 => 'Perlu latihan terarah',
            default => 'Prioritas utama',
        };
    }

    private static function recommendation(string $skill, int $gap): string
    {
        return match (true) {
            $gap === 0 => "Pertahankan {$skill} lewat project atau mentoring ringan.",
            $gap <= 10 => "Tambah latihan praktis untuk menutup sisa gap {$skill}.",
            $gap <= 25 => "Fokuskan roadmap berikutnya pada latihan dan evidence {$skill}.",
            default => "Mulai dari fondasi {$skill}, lalu validasi lewat project kecil.",
        };
    }
}
