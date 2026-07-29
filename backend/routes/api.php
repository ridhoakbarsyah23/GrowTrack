<?php

use App\Http\Controllers\Api\CareerDashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\CommerceController;
use App\Http\Controllers\Api\MentorFeedbackController;
use App\Http\Controllers\Api\PublicSummaryController;
use App\Http\Controllers\Api\UserJourneyController;
use Illuminate\Support\Facades\Route;

Route::get('/public-summary', PublicSummaryController::class);
Route::get('/products', [CommerceController::class, 'products']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register-options', [AuthController::class, 'registerOptions']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/payments/midtrans/notification', [CommerceController::class, 'midtransNotification']);

Route::middleware('auth.api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/career-dashboard', CareerDashboardController::class);
    Route::get('/orders/my', [CommerceController::class, 'myOrders']);
    Route::post('/orders', [CommerceController::class, 'createOrder']);
    Route::get('/assessment/current', [AssessmentController::class, 'current']);
    Route::post('/assessment/submit', [AssessmentController::class, 'submit']);
    Route::patch('/roadmap-progress/{progress}', [UserJourneyController::class, 'updateProgress']);
    Route::post('/project-submissions', [UserJourneyController::class, 'submitProject']);
    Route::get('/project-submissions/review-queue', [UserJourneyController::class, 'reviewQueue']);
    Route::patch('/project-submissions/{submission}/review', [UserJourneyController::class, 'reviewProject']);
    Route::get('/mentor-feedback', [MentorFeedbackController::class, 'index']);
    Route::post('/mentor-feedback', [MentorFeedbackController::class, 'store']);
    Route::patch('/mentor-feedback/{feedback}', [MentorFeedbackController::class, 'update']);
    Route::delete('/mentor-feedback/{feedback}', [MentorFeedbackController::class, 'destroy']);
});

Route::middleware(['auth.api', 'admin'])->prefix('admin')->group(function () {
    Route::get('/bootstrap', [AdminController::class, 'bootstrap']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::post('/career-goals', [AdminController::class, 'createCareerGoal']);
    Route::patch('/career-goals/{careerGoal}', [AdminController::class, 'updateCareerGoal']);
    Route::delete('/career-goals/{careerGoal}', [AdminController::class, 'deleteCareerGoal']);
    Route::post('/skills', [AdminController::class, 'createSkill']);
    Route::patch('/skills/{skill}', [AdminController::class, 'updateSkill']);
    Route::delete('/skills/{skill}', [AdminController::class, 'deleteSkill']);
    Route::post('/assessment-templates', [AdminController::class, 'createAssessmentTemplate']);
    Route::patch('/assessment-templates/{assessmentTemplate}', [AdminController::class, 'updateAssessmentTemplate']);
    Route::delete('/assessment-templates/{assessmentTemplate}', [AdminController::class, 'deleteAssessmentTemplate']);
    Route::post('/roadmap-modules', [AdminController::class, 'createRoadmapModule']);
    Route::patch('/roadmap-modules/{roadmapModule}', [AdminController::class, 'updateRoadmapModule']);
    Route::delete('/roadmap-modules/{roadmapModule}', [AdminController::class, 'deleteRoadmapModule']);
    Route::post('/skill-targets', [AdminController::class, 'upsertSkillTarget']);
    Route::patch('/skill-targets/{skillTarget}', [AdminController::class, 'updateSkillTarget']);
    Route::delete('/skill-targets/{skillTarget}', [AdminController::class, 'deleteSkillTarget']);
    Route::post('/assessment-questions', [AdminController::class, 'createAssessmentQuestion']);
    Route::patch('/assessment-questions/{assessmentQuestion}', [AdminController::class, 'updateAssessmentQuestion']);
    Route::delete('/assessment-questions/{assessmentQuestion}', [AdminController::class, 'deleteAssessmentQuestion']);
    Route::get('/orders', [CommerceController::class, 'adminOrders']);
    Route::patch('/orders/{order}', [CommerceController::class, 'updateOrderStatus']);
    Route::post('/products', [CommerceController::class, 'createProduct']);
    Route::patch('/products/{product}', [CommerceController::class, 'updateProduct']);
    Route::delete('/products/{product}', [CommerceController::class, 'deleteProduct']);
});
