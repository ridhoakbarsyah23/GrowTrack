<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SupportChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_chat_returns_deterministic_fallback_when_ai_is_disabled(): void
    {
        config(['services.openai.support_enabled' => false]);

        $this
            ->postJson('/api/support/chat', [
                'message' => 'Bagaimana cara register?',
            ])
            ->assertOk()
            ->assertJsonPath('mode', 'deterministic')
            ->assertJsonPath('provider_status', 'disabled')
            ->assertJsonPath('handoff', false)
            ->assertJsonFragment([
                'message' => 'Untuk daftar, pilih Register, isi profil karier, pilih career goal, lalu lanjutkan assessment agar skill gap dan roadmap kamu bisa dibuat.',
            ]);
    }

    public function test_support_chat_can_use_openai_when_enabled(): void
    {
        config([
            'services.openai.support_enabled' => true,
            'services.ai.support_provider' => 'openai',
            'services.openai.key' => 'test-key',
            'services.openai.base_url' => 'https://api.openai.test/v1',
            'services.openai.model' => 'gpt-5',
        ]);

        Http::fake([
            'api.openai.test/v1/responses' => Http::response([
                'output_text' => 'Kamu bisa buka Register, isi profil, lalu lanjut assessment.',
            ]),
        ]);

        $this
            ->postJson('/api/support/chat', [
                'message' => 'Aku mau daftar',
                'history' => [
                    ['role' => 'user', 'content' => 'Halo'],
                    ['role' => 'assistant', 'content' => 'Halo, ada yang bisa dibantu?'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('mode', 'openai')
            ->assertJsonPath('provider_status', 'openai_enhanced')
            ->assertJsonPath('message', 'Kamu bisa buka Register, isi profil, lalu lanjut assessment.');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.openai.test/v1/responses'
            && $request['model'] === 'gpt-5'
            && $request['store'] === false);
    }

    public function test_support_chat_can_use_ollama_when_enabled(): void
    {
        config([
            'services.openai.support_enabled' => true,
            'services.ai.support_provider' => 'ollama',
            'services.ollama.base_url' => 'http://ollama.test',
            'services.ollama.model' => 'qwen2.5:7b',
        ]);

        Http::fake([
            'ollama.test/api/chat' => Http::response([
                'message' => [
                    'content' => 'Buka Register, isi profil, lalu lanjutkan assessment supaya roadmap kamu muncul.',
                ],
            ]),
        ]);

        $this
            ->postJson('/api/support/chat', [
                'message' => 'Aku mau daftar',
            ])
            ->assertOk()
            ->assertJsonPath('mode', 'ollama')
            ->assertJsonPath('provider_status', 'ollama_enhanced')
            ->assertJsonPath('message', 'Buka Register, isi profil, lalu lanjutkan assessment supaya roadmap kamu muncul.');

        Http::assertSent(fn ($request) => $request->url() === 'http://ollama.test/api/chat'
            && $request['model'] === 'qwen2.5:7b'
            && $request['stream'] === false);
    }

    public function test_support_chat_falls_back_when_ollama_is_unavailable(): void
    {
        config([
            'services.openai.support_enabled' => true,
            'services.ai.support_provider' => 'ollama',
            'services.ollama.base_url' => 'http://ollama.test',
        ]);

        Http::fake([
            'ollama.test/api/chat' => Http::response(['error' => 'model not found'], 404),
        ]);

        $this
            ->postJson('/api/support/chat', [
                'message' => 'Bagaimana cara bayar?',
            ])
            ->assertOk()
            ->assertJsonPath('mode', 'deterministic')
            ->assertJsonPath('provider_status', 'fallback')
            ->assertJsonPath('fallback_reason', 'ollama_http_error');
    }
}
