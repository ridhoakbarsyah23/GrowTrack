<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use App\Support\SkillGapAnalysis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class CareerCoachController extends Controller
{
    public function insight(Request $request)
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $profile = DB::table('user_profiles')
            ->join('career_goals', 'career_goals.id', '=', 'user_profiles.career_goal_id')
            ->where('user_profiles.user_id', $user->id)
            ->select([
                'user_profiles.id',
                'user_profiles.role',
                'user_profiles.current_position',
                'user_profiles.target_position',
                'career_goals.title as career_goal',
            ])
            ->first();

        if (! $profile) {
            return response()->json(['message' => 'Profile karir belum tersedia.'], Response::HTTP_NOT_FOUND);
        }

        $assessment = DB::table('assessment_results')
            ->where('user_profile_id', $profile->id)
            ->orderByDesc('updated_at')
            ->first();

        $skillScores = collect(json_decode($assessment->skill_scores ?? '{}', true));
        $skillGapAnalysis = SkillGapAnalysis::forProfile((int) $profile->id, $skillScores);
        $highestGap = $skillGapAnalysis['summary']['highest_gap'];
        $nextRoadmap = $this->nextRoadmap($profile, $skillGapAnalysis['items']);
        $latestSubmission = DB::table('project_submissions')
            ->where('user_profile_id', $profile->id)
            ->orderByDesc('created_at')
            ->first(['title', 'status', 'score']);
        $mentorFeedback = DB::table('mentor_feedback')
            ->where('user_profile_id', $profile->id)
            ->orderByDesc('updated_at')
            ->first(['recommendation', 'score', 'notes']);

        $insight = [
            'mode' => 'deterministic',
            'provider_status' => config('services.openai.coach_enabled') ? 'missing_api_key' : 'disabled',
            'headline' => $this->headline($profile, (int) ($assessment->overall_score ?? 0)),
            'summary' => $this->summary($profile, $highestGap, $nextRoadmap, (int) ($assessment->overall_score ?? 0)),
            'focus' => [
                'skill' => $highestGap['skill'] ?? null,
                'gap' => $highestGap['gap'] ?? null,
                'reason' => $highestGap
                    ? "Gap terbesar kamu saat ini ada di {$highestGap['skill']}."
                    : 'Kerjakan assessment untuk menentukan fokus pengembangan pertama.',
            ],
            'next_roadmap' => $nextRoadmap,
            'recommended_actions' => $this->recommendedActions($assessment, $highestGap, $nextRoadmap, $latestSubmission, $mentorFeedback),
            'signals' => [
                'assessment_score' => (int) ($assessment->overall_score ?? 0),
                'target_source' => $skillGapAnalysis['summary']['target_source'],
                'latest_submission' => $latestSubmission ? [
                    'title' => $latestSubmission->title,
                    'status' => $latestSubmission->status,
                    'score' => $latestSubmission->score,
                ] : null,
                'mentor_feedback' => $mentorFeedback ? [
                    'recommendation' => $mentorFeedback->recommendation,
                    'score' => $mentorFeedback->score,
                    'notes' => $mentorFeedback->notes,
                ] : null,
            ],
            'generated_at' => now()->toISOString(),
        ];

        return response()->json($this->enhanceWithOpenAi($insight, $profile));
    }

    private function enhanceWithOpenAi(array $insight, object $profile): array
    {
        if (! config('services.openai.coach_enabled')) {
            return $insight;
        }

        $apiKey = config('services.openai.key');

        if (! $apiKey) {
            return $insight;
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout((int) config('services.openai.timeout', 12))
                ->post(rtrim((string) config('services.openai.base_url'), '/') . '/responses', [
                    'model' => config('services.openai.model', 'gpt-5'),
                    'instructions' => implode(' ', [
                        'You are Pathly AI Career Coach for Indonesian learners.',
                        'Use the provided profile and deterministic insight only.',
                        'Return compact JSON only with keys headline, summary, recommended_actions.',
                        'Keep the tone practical, encouraging, and specific.',
                    ]),
                    'input' => json_encode([
                        'profile' => [
                            'role' => $profile->role,
                            'current_position' => $profile->current_position,
                            'target_position' => $profile->target_position,
                            'career_goal' => $profile->career_goal,
                        ],
                        'insight' => $insight,
                    ], JSON_UNESCAPED_UNICODE),
                    'max_output_tokens' => 500,
                    'text' => [
                        'format' => ['type' => 'json_object'],
                    ],
                    'store' => false,
                ]);

            if (! $response->successful()) {
                return $this->openAiFallback($insight, 'openai_http_error');
            }

            $payload = $this->extractOpenAiJson($response->json());

            if (! $payload) {
                return $this->openAiFallback($insight, 'openai_invalid_response');
            }

            return array_merge($insight, [
                'mode' => 'openai',
                'provider_status' => 'openai_enhanced',
                'model' => config('services.openai.model', 'gpt-5'),
                'headline' => $payload['headline'] ?? $insight['headline'],
                'summary' => $payload['summary'] ?? $insight['summary'],
                'recommended_actions' => $this->normalizeOpenAiActions(
                    $payload['recommended_actions'] ?? null,
                    $insight['recommended_actions'],
                ),
            ]);
        } catch (\Throwable) {
            return $this->openAiFallback($insight, 'openai_unavailable');
        }
    }

    private function extractOpenAiJson(?array $response): ?array
    {
        $text = $response['output_text'] ?? null;

        if (! $text && isset($response['output']) && is_array($response['output'])) {
            foreach ($response['output'] as $output) {
                foreach (($output['content'] ?? []) as $content) {
                    if (isset($content['text']) && is_string($content['text'])) {
                        $text = $content['text'];
                        break 2;
                    }
                }
            }
        }

        if (! is_string($text) || trim($text) === '') {
            return null;
        }

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    private function normalizeOpenAiActions(mixed $actions, array $fallback): array
    {
        if (! is_array($actions)) {
            return $fallback;
        }

        $normalized = array_values(array_filter($actions, fn ($action) => is_string($action) && trim($action) !== ''));

        return $normalized ? array_slice($normalized, 0, 4) : $fallback;
    }

    private function openAiFallback(array $insight, string $reason): array
    {
        return array_merge($insight, [
            'provider_status' => 'fallback',
            'fallback_reason' => $reason,
        ]);
    }

    private function nextRoadmap(object $profile, $skillGaps): ?array
    {
        $progress = DB::table('roadmap_progress')
            ->join('roadmap_modules', 'roadmap_modules.id', '=', 'roadmap_progress.roadmap_module_id')
            ->leftJoin('skills', 'skills.id', '=', 'roadmap_modules.skill_id')
            ->where('roadmap_progress.user_profile_id', $profile->id)
            ->where('roadmap_progress.status', '!=', 'completed')
            ->select([
                'roadmap_progress.id',
                'roadmap_modules.sequence',
                'roadmap_modules.title',
                'roadmap_modules.module_type',
                'roadmap_modules.duration_hours',
                'roadmap_modules.outcome',
                'skills.name as focus_skill',
            ])
            ->orderBy('roadmap_modules.sequence')
            ->get()
            ->map(function ($item) use ($skillGaps) {
                $gap = $this->matchedGap($item, $skillGaps);
                $gapValue = (int) ($gap['gap'] ?? 0);

                return [
                    'progress_id' => $item->id,
                    'title' => $item->title,
                    'module_type' => $item->module_type,
                    'duration_hours' => $item->duration_hours,
                    'outcome' => $item->outcome,
                    'focus_skill' => $item->focus_skill,
                    'priority_rank' => $gapValue,
                    'related_gap' => $gap,
                    'sequence' => $item->sequence,
                ];
            })
            ->sortBy([
                ['priority_rank', 'desc'],
                ['sequence', 'asc'],
            ])
            ->values();

        return $progress->first();
    }

    private function matchedGap(object $item, $skillGaps): ?array
    {
        if ($item->focus_skill) {
            return collect($skillGaps)->firstWhere('skill', $item->focus_skill);
        }

        $haystack = strtolower("{$item->title} {$item->outcome} {$item->module_type}");

        return collect($skillGaps)->first(function (array $gap) use ($haystack) {
            return str_contains($haystack, strtolower($gap['skill']));
        });
    }

    private function headline(object $profile, int $assessmentScore): string
    {
        if ($assessmentScore === 0) {
            return "Mulai assessment untuk membuka arah menuju {$profile->career_goal}.";
        }

        return "Arah terdekat kamu: perkuat jalur menuju {$profile->career_goal}.";
    }

    private function summary(object $profile, ?array $highestGap, ?array $nextRoadmap, int $assessmentScore): string
    {
        if ($assessmentScore === 0) {
            return "Pathly AI belum punya cukup sinyal assessment. Isi assessment dulu agar gap dan roadmap bisa diprioritaskan.";
        }

        $gapText = $highestGap
            ? "Fokus utama saat ini adalah {$highestGap['skill']} dengan gap {$highestGap['gap']} poin"
            : 'Fokus utama belum terlihat karena target skill belum tersedia';
        $roadmapText = $nextRoadmap
            ? "lanjutkan modul {$nextRoadmap['title']}"
            : 'minta admin menambahkan roadmap untuk target ini';

        return "{$gapText}. Untuk target {$profile->target_position}, langkah paling masuk akal berikutnya adalah {$roadmapText}.";
    }

    private function recommendedActions(?object $assessment, ?array $highestGap, ?array $nextRoadmap, ?object $latestSubmission, ?object $mentorFeedback): array
    {
        if (! $assessment) {
            return [
                'Kerjakan career assessment supaya Pathly AI punya baseline kompetensi.',
                'Pastikan target karier sudah sesuai dengan tujuan 3-5 tahun.',
                'Setelah assessment, cek skill gap dan mulai roadmap pertama.',
            ];
        }

        $actions = [];

        if ($highestGap) {
            $actions[] = "Fokus belajar pada {$highestGap['skill']} sampai gap turun di bawah 10 poin.";
        }

        if ($nextRoadmap) {
            $actions[] = "Kerjakan modul {$nextRoadmap['title']} sebagai langkah roadmap berikutnya.";
        }

        $actions[] = $latestSubmission
            ? "Review evidence {$latestSubmission->title} dan lanjutkan improvement berdasarkan status {$latestSubmission->status}."
            : 'Kirim project evidence pertama setelah modul prioritas selesai.';

        $actions[] = $mentorFeedback
            ? "Gunakan feedback mentor: {$mentorFeedback->recommendation}."
            : 'Minta feedback mentor setelah ada evidence yang bisa dinilai.';

        return array_slice($actions, 0, 4);
    }
}
