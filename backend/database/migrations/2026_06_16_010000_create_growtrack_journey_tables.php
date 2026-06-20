<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('career_goal_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('department')->nullable();
            $table->string('current_position')->nullable();
            $table->string('target_position');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('assessment_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_template_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('overall_score');
            $table->json('skill_scores');
            $table->text('summary');
            $table->timestamps();
        });

        Schema::create('roadmap_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('roadmap_module_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->unique(['user_profile_id', 'roadmap_module_id']);
        });

        Schema::create('project_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('roadmap_module_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('status');
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamps();
        });

        Schema::create('mentor_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->string('recommendation');
            $table->unsignedTinyInteger('score');
            $table->text('notes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_feedback');
        Schema::dropIfExists('project_submissions');
        Schema::dropIfExists('roadmap_progress');
        Schema::dropIfExists('assessment_results');
        Schema::dropIfExists('user_profiles');
    }
};
