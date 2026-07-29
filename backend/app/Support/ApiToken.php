<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiToken
{
    private const IDLE_TIMEOUT_MINUTES = 30;

    public static function user(Request $request): ?object
    {
        if ($request->attributes->has('api_user')) {
            return $request->attributes->get('api_user');
        }

        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        $record = DB::table('api_tokens')
            ->join('users', 'users.id', '=', 'api_tokens.user_id')
            ->where('api_tokens.token_hash', hash('sha256', $token))
            ->select([
                'api_tokens.id as token_id',
                'api_tokens.last_used_at',
                'api_tokens.created_at as token_created_at',
                'users.id',
                'users.name',
                'users.email',
                'users.role',
            ])
            ->first();

        if (! $record) {
            return null;
        }

        $lastActivity = $record->last_used_at ?: $record->token_created_at;

        if ($lastActivity && Carbon::parse($lastActivity)->lte(now()->subMinutes(self::IDLE_TIMEOUT_MINUTES))) {
            DB::table('api_tokens')->where('id', $record->token_id)->delete();

            return null;
        }

        DB::table('api_tokens')
            ->where('id', $record->token_id)
            ->update(['last_used_at' => now(), 'updated_at' => now()]);

        $user = (object) [
            'id' => $record->id,
            'name' => $record->name,
            'email' => $record->email,
            'role' => $record->role,
        ];

        $request->attributes->set('api_user', $user);
        return $user;
    }
}
