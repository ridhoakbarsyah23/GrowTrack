<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('career_goals', function (Blueprint $table) {
            $table->id();
            $table->string('audience');
            $table->string('title');
            $table->string('level');
            $table->text('summary');
            $table->timestamps();
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->text('description');
            $table->timestamps();
        });

        Schema::create('career_goal_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_goal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('target_score');
            $table->timestamps();
            $table->unique(['career_goal_id', 'skill_id']);
        });

        Schema::create('assessment_templates', function (Blueprint $table) {
            $table->id();
            $table->string('audience');
            $table->string('title');
            $table->text('description');
            $table->unsignedTinyInteger('question_count');
            $table->timestamps();
        });

        Schema::create('roadmap_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_goal_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('sequence');
            $table->string('title');
            $table->string('module_type');
            $table->unsignedTinyInteger('duration_hours');
            $table->text('outcome');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmap_modules');
        Schema::dropIfExists('assessment_templates');
        Schema::dropIfExists('career_goal_skill');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('career_goals');
    }
};
