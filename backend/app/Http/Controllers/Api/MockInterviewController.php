<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class MockInterviewController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $interviews = DB::table('mock_interviews')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['interviews' => $interviews]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        $interview = DB::table('mock_interviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $interview) {
            return response()->json(['message' => 'Interview tidak ditemukan.'], Response::HTTP_NOT_FOUND);
        }

        $messages = DB::table('mock_interview_messages')
            ->where('mock_interview_id', $id)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'interview' => $interview,
            'messages' => $messages,
        ]);
    }

    public function start(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'target_role' => ['required', 'string', 'max:255'],
        ]);

        $interviewId = DB::table('mock_interviews')->insertGetId([
            'user_id' => $user->id,
            'target_role' => $validated['target_role'],
            'status' => 'ongoing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $initialMessage = "Halo! Saya adalah AI Interviewer Anda hari ini. Kita akan melakukan simulasi interview untuk posisi {$validated['target_role']}. Silakan perkenalkan diri Anda terlebih dahulu.";

        $messageId = DB::table('mock_interview_messages')->insertGetId([
            'mock_interview_id' => $interviewId,
            'role' => 'assistant',
            'content' => $initialMessage,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $interview = DB::table('mock_interviews')->where('id', $interviewId)->first();
        $message = DB::table('mock_interview_messages')->where('id', $messageId)->first();

        return response()->json([
            'message' => 'Sesi interview dimulai.',
            'interview' => $interview,
            'new_message' => $message,
        ], Response::HTTP_CREATED);
    }

    public function reply(Request $request, $id)
    {
        $user = $request->user();

        $interview = DB::table('mock_interviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'ongoing')
            ->first();

        if (! $interview) {
            return response()->json(['message' => 'Sesi interview tidak valid atau sudah selesai.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        // Save user message
        DB::table('mock_interview_messages')->insert([
            'mock_interview_id' => $interview->id,
            'role' => 'user',
            'content' => $validated['message'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Get history for AI context
        $history = DB::table('mock_interview_messages')
            ->where('mock_interview_id', $interview->id)
            ->orderBy('id', 'asc')
            ->get(['role', 'content']);

        // Format history for AI
        $messages = [];
        $messages[] = [
            'role' => 'system',
            'content' => "You are an expert HR Interviewer conducting a job interview for the role of {$interview->target_role}. Ask one relevant interview question at a time. Do not provide a score or feedback yet. Speak in Indonesian naturally.",
        ];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg->role,
                'content' => $msg->content,
            ];
        }

        $aiResponse = $this->callAi($messages);

        if (! $aiResponse) {
            return response()->json(['message' => 'AI sedang tidak tersedia. Coba lagi.'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        // Save AI message
        $aiMessageId = DB::table('mock_interview_messages')->insertGetId([
            'mock_interview_id' => $interview->id,
            'role' => 'assistant',
            'content' => $aiResponse,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $aiMessageRecord = DB::table('mock_interview_messages')->where('id', $aiMessageId)->first();

        return response()->json([
            'new_message' => $aiMessageRecord,
        ]);
    }

    public function finish(Request $request, $id)
    {
        $user = $request->user();

        $interview = DB::table('mock_interviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'ongoing')
            ->first();

        if (! $interview) {
            return response()->json(['message' => 'Sesi interview tidak valid atau sudah selesai.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Get full history
        $history = DB::table('mock_interview_messages')
            ->where('mock_interview_id', $interview->id)
            ->orderBy('id', 'asc')
            ->get(['role', 'content']);

        $messages = [];
        $messages[] = [
            'role' => 'system',
            'content' => "You are an expert HR Assessor. Evaluate the following interview transcript for the role of {$interview->target_role}. Provide a score out of 100, and a detailed feedback paragraph in Indonesian explaining what went well and what needs improvement. You MUST respond ONLY in valid JSON format: {\"score\": 85, \"feedback\": \"...\"}",
        ];

        $transcript = "";
        foreach ($history as $msg) {
            $role = $msg->role === 'assistant' ? 'Interviewer' : 'Candidate';
            $transcript .= "{$role}: {$msg->content}\n\n";
        }

        $messages[] = [
            'role' => 'user',
            'content' => "Here is the interview transcript:\n" . $transcript,
        ];

        $aiResponse = $this->callAi($messages, true);

        $score = null;
        $feedback = "Gagal memproses feedback dari AI.";

        if ($aiResponse) {
            // parse JSON
            $parsed = json_decode($aiResponse, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $score = $parsed['score'] ?? null;
                $feedback = $parsed['feedback'] ?? null;
            } else {
                // Try to extract JSON if there's markdown wrapping
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

        DB::table('mock_interviews')
            ->where('id', $interview->id)
            ->update([
                'status' => 'completed',
                'score' => (int) $score,
                'feedback' => $feedback,
                'updated_at' => now(),
            ]);

        $updatedInterview = DB::table('mock_interviews')->where('id', $interview->id)->first();

        return response()->json([
            'message' => 'Interview selesai.',
            'interview' => $updatedInterview,
        ]);
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
                'temperature' => 0.7,
            ];

            if ($jsonMode) {
                $payload['response_format'] = ['type' => 'json_object'];
            }

            // Using the standard OpenAI endpoint, not the v1/responses which looks like a different schema in SupportChatController, wait let me check the generic one.
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout((int) config('services.openai.timeout', 20))
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
                ->timeout((int) config('services.ollama.timeout', 30))
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
