<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'midtrans' => [
        'enabled' => env('MIDTRANS_ENABLED', false),
        'environment' => env('MIDTRANS_ENV', 'sandbox'),
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'finish_url' => env('MIDTRANS_FINISH_URL'),
    ],

    'ai' => [
        'support_provider' => env('AI_SUPPORT_PROVIDER', 'openai'),
    ],

    'openai' => [
        'coach_enabled' => env('AI_COACH_ENABLED', false),
        'support_enabled' => env('AI_SUPPORT_ENABLED', false),
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-5'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'timeout' => env('OPENAI_TIMEOUT', 12),
    ],

    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'model' => env('OLLAMA_MODEL', 'qwen2.5:1.5b'),
        'timeout' => env('OLLAMA_TIMEOUT', 30),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
