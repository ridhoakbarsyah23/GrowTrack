<?php

use App\Http\Controllers\Api\CareerDashboardController;
use App\Http\Controllers\Api\CareerCoachController;
use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\AdminAnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\CommerceController;
use App\Http\Controllers\Api\MentorFeedbackController;
use App\Http\Controllers\Api\MasterDataImportController;
use App\Http\Controllers\Api\MockInterviewController;
use App\Http\Controllers\Api\PublicSummaryController;
use App\Http\Controllers\Api\ResumeReviewController;
use App\Http\Controllers\Api\SupportChatController;
use App\Http\Controllers\Api\UserJourneyController;
use Illuminate\Support\Facades\Route;

Route::get('/public-summary', PublicSummaryController::class);
Route::post('/support/chat', SupportChatController::class);
Route::get('/payment-settings', [AppSettingsController::class, 'paymentSettings']);
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
    Route::get('/career-coach/insight', [CareerCoachController::class, 'insight']);
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
    
    Route::get('/mock-interviews', [MockInterviewController::class, 'index']);
    Route::post('/mock-interviews', [MockInterviewController::class, 'start']);
    Route::get('/mock-interviews/{id}', [MockInterviewController::class, 'show']);
    Route::post('/mock-interviews/{id}/reply', [MockInterviewController::class, 'reply']);
    Route::post('/mock-interviews/{id}/finish', [MockInterviewController::class, 'finish']);
    
    Route::get('/resume-reviews', [ResumeReviewController::class, 'index']);
    Route::post('/resume-reviews', [ResumeReviewController::class, 'store']);
    Route::get('/resume-reviews/{id}', [ResumeReviewController::class, 'show']);
});

Route::middleware(['auth.api', 'admin'])->prefix('admin')->group(function () {
    Route::get('/bootstrap', [AdminController::class, 'bootstrap']);
    Route::get('/analytics', AdminAnalyticsController::class);
    Route::get('/master-data-import/preview', [MasterDataImportController::class, 'preview']);
    Route::post('/master-data-import', [MasterDataImportController::class, 'import']);
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
    Route::patch('/settings/manual-payment', [AppSettingsController::class, 'updateManualPayment']);
    Route::post('/products', [CommerceController::class, 'createProduct']);
    Route::patch('/products/{product}', [CommerceController::class, 'updateProduct']);
    Route::delete('/products/{product}', [CommerceController::class, 'deleteProduct']);
});
