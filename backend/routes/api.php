<?php

use App\Http\Controllers\Api\CareerDashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\CommerceController;
use App\Http\Controllers\Api\PublicSummaryController;
use Illuminate\Support\Facades\Route;

Route::get('/public-summary', PublicSummaryController::class);
Route::get('/products', [CommerceController::class, 'products']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register-options', [AuthController::class, 'registerOptions']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/me', [AuthController::class, 'me']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/career-dashboard', CareerDashboardController::class);
Route::get('/orders/my', [CommerceController::class, 'myOrders']);
Route::post('/orders', [CommerceController::class, 'createOrder']);
Route::post('/payments/midtrans/notification', [CommerceController::class, 'midtransNotification']);
Route::get('/assessment/current', [AssessmentController::class, 'current']);
Route::post('/assessment/submit', [AssessmentController::class, 'submit']);

Route::get('/admin/bootstrap', [AdminController::class, 'bootstrap']);
Route::post('/admin/users', [AdminController::class, 'createUser']);
Route::post('/admin/career-goals', [AdminController::class, 'createCareerGoal']);
Route::post('/admin/skills', [AdminController::class, 'createSkill']);
Route::post('/admin/assessment-templates', [AdminController::class, 'createAssessmentTemplate']);
Route::post('/admin/roadmap-modules', [AdminController::class, 'createRoadmapModule']);
Route::post('/admin/skill-targets', [AdminController::class, 'upsertSkillTarget']);
Route::post('/admin/assessment-questions', [AdminController::class, 'createAssessmentQuestion']);
Route::get('/admin/orders', [CommerceController::class, 'adminOrders']);
Route::patch('/admin/orders/{order}', [CommerceController::class, 'updateOrderStatus']);
