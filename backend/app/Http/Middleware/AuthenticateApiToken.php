<?php

namespace App\Http\Middleware;

use App\Support\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = ApiToken::user($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $request->attributes->set('api_user', $user);

        return $next($request);
    }
}
