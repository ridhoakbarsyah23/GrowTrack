<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class MasterDataImportController extends Controller
{
    public function preview(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        try {
            $data = loadPathlyMasterData();
            $errors = validatePathlyMasterData($data);
        } catch (Throwable $exception) {
            return response()->json([
                'valid' => false,
                'errors' => [$exception->getMessage()],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'valid' => $errors === [],
            'errors' => $errors,
            'counts' => pathlyMasterDataCounts($data),
        ], $errors ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK);
    }

    public function import(Request $request)
    {
        if (! $this->admin($request)) {
            return response()->json(['message' => 'Admin access required.'], Response::HTTP_FORBIDDEN);
        }

        try {
            $data = loadPathlyMasterData();
            $errors = validatePathlyMasterData($data);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($errors) {
            return response()->json([
                'message' => 'Template master data belum valid.',
                'errors' => $errors,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(fn () => importPathlyMasterData($data));

        return response()->json([
            'message' => 'Master data berhasil diimport.',
            'counts' => pathlyMasterDataCounts($data),
        ]);
    }

    private function admin(Request $request): ?object
    {
        $user = ApiToken::user($request);

        return $user && $user->role === 'admin' ? $user : null;
    }
}
