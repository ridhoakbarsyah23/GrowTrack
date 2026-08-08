<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class ResumeReviewController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $reviews = DB::table('resume_reviews')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['reviews' => $reviews]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        $review = DB::table('resume_reviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['review' => $review]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'target_role' => ['required', 'string', 'max:255'],
            'resume_text' => ['required', 'string', 'max:15000'],
        ]);

        $prompt = "You are an expert HR Assessor. Review the following resume text for the role of {$validated['target_role']}. "
            . "Provide a score out of 100 based on how well the candidate fits the role. "
            . "Then, provide a detailed evaluation in Indonesian. Include what is good, what is missing, and how to improve. "
            . "You MUST respond ONLY in valid JSON format: {\"score\": 85, \"feedback\": \"...\"}";

        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => "Resume Text:\n" . $validated['resume_text']],
        ];

        $aiResponse = $this->callAi($messages, true);

        $score = null;
        $feedback = "Gagal memproses feedback dari AI.";

        if ($aiResponse) {
            $parsed = json_decode($aiResponse, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $score = $parsed['score'] ?? null;
                $feedback = $parsed['feedback'] ?? null;
            } else {
                preg_match('/\{[\s\S]*\}/', $aiResponse, $matches);
                if (isset($matches[0])) {
                    $parsed = json_decode($matches[0], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $score = $parsed['score'] ?? null;
                        $feedback = $parsed['feedback'] ?? null;
                    }
                }
            }
        }

        $reviewId = DB::table('resume_reviews')->insertGetId([
            'user_id' => $user->id,
            'target_role' => $validated['target_role'],
            'resume_text' => $validated['resume_text'],
            'score' => (int) $score,
            'feedback' => $feedback,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $review = DB::table('resume_reviews')->where('id', $reviewId)->first();

        return response()->json([
            'message' => 'Review berhasil diselesaikan.',
            'review' => $review,
        ], Response::HTTP_CREATED);
    }

    private function callAi(array $messages, bool $jsonMode = false): ?string
    {
        $provider = (string) config('services.ai.support_provider', 'openai');

        if ($provider === 'openai') {
            return $this->callOpenAi($messages, $jsonMode);
        }

        return $this->callOllama($messages, $jsonMode);
    }

    private function callOpenAi(array $messages, bool $jsonMode = false): ?string
    {
        $apiKey = config('services.openai.key');

        if (! $apiKey) {
            return "Maaf, OpenAI API Key belum dikonfigurasi.";
        }

        try {
            $payload = [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => $messages,
                'temperature' => 0.5,
            ];

            if ($jsonMode) {
                $payload['response_format'] = ['type' => 'json_object'];
            }

            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout((int) config('services.openai.timeout', 25))
                ->post(rtrim((string) config('services.openai.base_url'), '/') . '/chat/completions', $payload);

            if (! $response->successful()) {
                return null;
            }

            return $response->json('choices.0.message.content');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function callOllama(array $messages, bool $jsonMode = false): ?string
    {
        $baseUrl = rtrim((string) config('services.ollama.base_url'), '/');
        $model = (string) config('services.ollama.model', 'qwen2.5:1.5b');

        try {
            $payload = [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
            ];

            if ($jsonMode) {
                $payload['format'] = 'json';
            }

            $response = Http::acceptJson()
                ->timeout((int) config('services.ollama.timeout', 45))
                ->post($baseUrl . '/api/chat', $payload);

            if (! $response->successful()) {
                return null;
            }

            return $response->json('message.content');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
