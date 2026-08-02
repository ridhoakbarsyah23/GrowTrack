<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    private const LEARNER_ROLES = ['student', 'fresh_graduate', 'employee'];

    public function registerOptions()
    {
        return response()->json([
            'career_goals' => DB::table('career_goals')
                ->select(['id', 'audience', 'title', 'level', 'summary'])
                ->orderBy('audience')
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(self::LEARNER_ROLES)],
            'career_goal_id' => ['required', 'exists:career_goals,id'],
            'education' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'current_position' => ['required', 'string', 'max:255'],
            'experience_summary' => ['nullable', 'string'],
            'self_reported_skills' => ['nullable', 'string'],
            'interests' => ['nullable', 'string'],
            'target_position' => ['required', 'string', 'max:255'],
        ]);

        $careerGoal = DB::table('career_goals')->where('id', $validated['career_goal_id'])->first();

        if (! $careerGoal || $careerGoal->audience !== $validated['role']) {
            return response()->json([
                'message' => 'Career goal tidak sesuai dengan tipe user yang dipilih.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $now = now();
        $userId = DB::table('users')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $profileId = DB::table('user_profiles')->insertGetId([
            'user_id' => $userId,
            'career_goal_id' => $validated['career_goal_id'],
            'role' => $validated['role'],
            'education' => $validated['education'] ?? null,
            'department' => $validated['department'] ?? null,
            'current_position' => $validated['current_position'],
            'experience_summary' => $validated['experience_summary'] ?? null,
            'self_reported_skills' => $validated['self_reported_skills'] ?? null,
            'interests' => $validated['interests'] ?? null,
            'target_position' => $validated['target_position'],
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->createInitialRoadmapProgress($profileId, (int) $validated['career_goal_id']);

        $user = DB::table('users')->where('id', $userId)->first();
        $plainToken = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $userId,
            'token_hash' => hash('sha256', $plainToken),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'token' => $plainToken,
            'user' => $this->userPayload($user),
        ], Response::HTTP_CREATED);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $plainToken = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'token' => $plainToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = $this->userFromToken($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json(['user' => $this->userPayload($user)]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();

        if ($token) {
            DB::table('api_tokens')->where('token_hash', hash('sha256', $token))->delete();
        }

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = DB::table('users')->where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'Jika email terdaftar, instruksi reset password akan tersedia.',
            ]);
        }

        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            [
                'token' => hash('sha256', $plainToken),
                'created_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Token reset password berhasil dibuat.',
            'reset_token' => $plainToken,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! hash_equals($record->token, hash('sha256', $validated['token']))) {
            return response()->json([
                'message' => 'Token reset password tidak valid.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($record->created_at && now()->diffInMinutes(Carbon::parse($record->created_at)) > 60) {
            return response()->json([
                'message' => 'Token reset password sudah kedaluwarsa.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::table('users')
            ->where('email', $validated['email'])
            ->update([
                'password' => Hash::make($validated['password']),
                'updated_at' => now(),
            ]);

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
        $user = DB::table('users')->where('email', $validated['email'])->first();

        if ($user) {
            DB::table('api_tokens')->where('user_id', $user->id)->delete();
        }

        return response()->json(['message' => 'Password berhasil direset. Silakan login ulang.']);
    }


    private function userFromToken(Request $request): ?object
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        $record = DB::table('api_tokens')
            ->join('users', 'users.id', '=', 'api_tokens.user_id')
            ->where('api_tokens.token_hash', hash('sha256', $token))
            ->select(['users.id', 'users.name', 'users.email', 'users.role'])
            ->first();

        if ($record) {
            DB::table('api_tokens')
                ->where('token_hash', hash('sha256', $token))
                ->update(['last_used_at' => now(), 'updated_at' => now()]);
        }

        return $record;
    }

    private function userPayload(object $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'employee',
        ];
    }

    private function createInitialRoadmapProgress(int $profileId, int $careerGoalId): void
    {
        $now = now();
        $modules = DB::table('roadmap_modules')
            ->where('career_goal_id', $careerGoalId)
            ->orderBy('sequence')
            ->get(['id']);

        foreach ($modules as $module) {
            DB::table('roadmap_progress')->insert([
                'user_profile_id' => $profileId,
                'roadmap_module_id' => $module->id,
                'status' => 'not_started',
                'progress_percent' => 0,
                'due_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
