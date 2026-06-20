<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiToken
{
    public static function user(Request $request): ?object
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        $user = DB::table('api_tokens')
            ->join('users', 'users.id', '=', 'api_tokens.user_id')
            ->where('api_tokens.token_hash', hash('sha256', $token))
            ->select(['users.id', 'users.name', 'users.email', 'users.role'])
            ->first();

        if ($user) {
            DB::table('api_tokens')
                ->where('token_hash', hash('sha256', $token))
                ->update(['last_used_at' => now(), 'updated_at' => now()]);
        }

        return $user;
    }
}
