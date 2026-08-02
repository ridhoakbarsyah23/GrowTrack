<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SupportChatController extends Controller
{
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:800'],
            'history' => ['nullable', 'array', 'max:8'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:800'],
        ]);

        $fallback = $this->fallbackAnswer($validated['message']);

        if (! config('services.openai.support_enabled')) {
            return response()->json($fallback);
        }

        $provider = (string) config('services.ai.support_provider', 'openai');

        return match ($provider) {
            'ollama' => $this->answerWithOllama($validated, $fallback),
            'openai' => $this->answerWithOpenAi($validated, $fallback),
            default => response()->json(array_merge($fallback, [
                'provider_status' => 'fallback',
                'fallback_reason' => 'unsupported_provider',
            ])),
        };
    }

    private function answerWithOpenAi(array $validated, array $fallback)
    {
        $apiKey = config('services.openai.key');

        if (! $apiKey) {
            return response()->json(array_merge($fallback, [
                'provider_status' => 'missing_api_key',
            ]));
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout((int) config('services.openai.timeout', 12))
                ->post(rtrim((string) config('services.openai.base_url'), '/') . '/responses', [
                    'model' => config('services.openai.model', 'gpt-5'),
                    'instructions' => $this->instructions(),
                    'input' => $this->inputPayload($validated),
                    'max_output_tokens' => 450,
                    'store' => false,
                ]);

            if (! $response->successful()) {
                return response()->json(array_merge($fallback, [
                    'provider_status' => 'fallback',
                    'fallback_reason' => 'openai_http_error',
                ]));
            }

            $answer = $this->extractText($response->json());

            if (! $answer) {
                return response()->json(array_merge($fallback, [
                    'provider_status' => 'fallback',
                    'fallback_reason' => 'openai_invalid_response',
                ]));
            }

            return response()->json([
                'mode' => 'openai',
                'provider_status' => 'openai_enhanced',
                'message' => $answer,
                'handoff' => $this->needsHumanHandoff($answer),
            ]);
        } catch (\Throwable) {
            return response()->json(array_merge($fallback, [
                'provider_status' => 'fallback',
                'fallback_reason' => 'openai_unavailable',
            ]));
        }
    }

    private function answerWithOllama(array $validated, array $fallback)
    {
        $baseUrl = rtrim((string) config('services.ollama.base_url'), '/');
        $model = (string) config('services.ollama.model', 'qwen2.5:7b');

        if ($baseUrl === '' || $model === '') {
            return response()->json(array_merge($fallback, [
                'provider_status' => 'fallback',
                'fallback_reason' => 'ollama_not_configured',
            ]));
        }

        try {
            $messages = array_merge(
                [['role' => 'system', 'content' => $this->instructions()]],
                array_map(
                    fn (array $item) => [
                        'role' => $item['role'],
                        'content' => $item['content'],
                    ],
                    array_slice($validated['history'] ?? [], -6)
                ),
                [['role' => 'user', 'content' => $this->inputPayload($validated)]]
            );

            $response = Http::acceptJson()
                ->timeout((int) config('services.ollama.timeout', 30))
                ->post($baseUrl . '/api/chat', [
                    'model' => $model,
                    'messages' => $messages,
                    'stream' => false,
                ]);

            if (! $response->successful()) {
                return response()->json(array_merge($fallback, [
                    'provider_status' => 'fallback',
                    'fallback_reason' => 'ollama_http_error',
                ]));
            }

            $answer = $this->extractOllamaText($response->json());

            if (! $answer) {
                return response()->json(array_merge($fallback, [
                    'provider_status' => 'fallback',
                    'fallback_reason' => 'ollama_invalid_response',
                ]));
            }

            return response()->json([
                'mode' => 'ollama',
                'provider_status' => 'ollama_enhanced',
                'message' => $answer,
                'handoff' => $this->needsHumanHandoff($answer),
            ]);
        } catch (\Throwable) {
            return response()->json(array_merge($fallback, [
                'provider_status' => 'fallback',
                'fallback_reason' => 'ollama_unavailable',
            ]));
        }
    }

    private function instructions(): string
    {
        return implode(' ', [
            'You are Pathly AI Helpdesk Support for Indonesian users.',
            'Answer only about Pathly AI app usage: login, register, assessment, dashboard, roadmap, checkout, manual payment, and admin setup.',
            'Use only the provided app_context and recent conversation; do not add steps that are not in the app, such as SMS verification, phone verification, OTP, or external identity checks.',
            'Answer the current user question directly; do not explain unrelated features unless the user asks.',
            'Keep answers concise, friendly, and actionable in Indonesian, with at most 4 bullets or short steps.',
            'Do not invent payment policies, order status, private account data, prices, or credentials.',
            'If the user asks about private account/order data or the answer is uncertain, tell them to contact human helpdesk.',
        ]);
    }

    private function inputPayload(array $validated): string
    {
        return json_encode([
            'current_user_message' => $validated['message'],
            'recent_history' => array_slice($validated['history'] ?? [], -8),
            'app_context' => $this->appContext(),
        ], JSON_UNESCAPED_UNICODE);
    }

    private function appContext(): array
    {
        return [
            'career_goals' => DB::table('career_goals')->count(),
            'assessment_templates' => DB::table('assessment_templates')->count(),
            'assessment_questions' => DB::table('assessment_questions')->count(),
            'active_products' => DB::table('learning_products')->where('status', 'active')->count(),
            'manual_payment_configured' => filled(AppSettingsController::manualPaymentInstructions()),
            'public_flow' => [
                'register membuat career profile awal',
                'assessment membuka skill gap dan career profile result',
                'dashboard menampilkan readiness, roadmap, evidence, dan coach insight',
                'checkout butuh login/register dan produk active',
                'order manual menjadi paid setelah admin approve pembayaran',
            ],
            'canonical_guides' => [
                'register_to_assessment' => [
                    'Buka Register dari halaman depan.',
                    'Isi nama lengkap, email, password minimal 8 karakter, tipe user, pendidikan, posisi/status saat ini, pengalaman, skill, minat, dan target karier.',
                    'Klik Buat Career Profile.',
                    'Setelah register berhasil, user diarahkan ke halaman Assessment.',
                ],
                'assessment' => [
                    'Buka halaman Assessment setelah login/register.',
                    'Isi skor pada setiap pertanyaan skill yang tersedia.',
                    'Klik Submit assessment.',
                    'Setelah submit, user bisa melihat Career Profile, Skill Gap Analysis, lalu lanjut ke Dashboard.',
                ],
                'dashboard' => [
                    'Dashboard menampilkan readiness, roadmap, evidence, dan coach insight.',
                    'Jika assessment belum pernah diisi, dashboard menampilkan ajakan untuk mengisi assessment.',
                ],
                'manual_payment' => [
                    'Checkout hanya untuk produk berstatus active.',
                    'User login/register, membuat order, lalu mengikuti instruksi pembayaran manual.',
                    'Status order menjadi paid setelah admin approve pembayaran.',
                ],
            ],
        ];
    }

    private function fallbackAnswer(string $message): array
    {
        $normalized = strtolower($message);

        $answer = match (true) {
            str_contains($normalized, 'login') || str_contains($normalized, 'masuk') => 'Untuk login, buka halaman Login lalu masukkan email dan password. Jika lupa password, gunakan menu Reset password di halaman login.',
            str_contains($normalized, 'register') || str_contains($normalized, 'daftar') => 'Untuk daftar, pilih Register, isi profil karier, pilih career goal, lalu lanjutkan assessment agar skill gap dan roadmap kamu bisa dibuat.',
            str_contains($normalized, 'assessment') || str_contains($normalized, 'asesmen') => 'Assessment dipakai untuk membaca kemampuan awal. Isi semua pertanyaan, submit, lalu cek hasil career profile dan skill gap di halaman assessment atau dashboard.',
            str_contains($normalized, 'bayar') || str_contains($normalized, 'payment') || str_contains($normalized, 'checkout') => 'Untuk checkout, pilih produk aktif, login atau register, lalu buat order. Jika memakai transfer manual, tunggu admin mengubah status order menjadi paid setelah pembayaran diterima.',
            str_contains($normalized, 'admin') => 'Admin bisa memakai Setup Wizard untuk cek data utama, Import Data untuk mengisi template awal, Products untuk publish produk, dan Orders untuk approve pembayaran.',
            default => 'Aku bisa bantu soal login, register, assessment, dashboard, roadmap, checkout, pembayaran manual, dan setup admin Pathly AI. Untuk kasus akun atau order spesifik, hubungi helpdesk manusia.',
        };

        return [
            'mode' => 'deterministic',
            'provider_status' => config('services.openai.support_enabled') ? 'missing_api_key' : 'disabled',
            'message' => $answer,
            'handoff' => str_contains($normalized, 'order') || str_contains($normalized, 'akun') || str_contains($normalized, 'password'),
        ];
    }

    private function extractText(?array $response): ?string
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

        return trim($text);
    }

    private function extractOllamaText(?array $response): ?string
    {
        $text = $response['message']['content'] ?? null;

        if (! is_string($text) || trim($text) === '') {
            return null;
        }

        return trim($text);
    }

    private function needsHumanHandoff(string $answer): bool
    {
        $normalized = strtolower($answer);

        return str_contains($normalized, 'helpdesk manusia')
            || str_contains($normalized, 'hubungi helpdesk')
            || str_contains($normalized, 'admin');
    }
}
