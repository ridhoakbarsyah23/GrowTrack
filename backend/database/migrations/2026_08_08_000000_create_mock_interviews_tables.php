<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mock_interviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('target_role');
            $table->enum('status', ['ongoing', 'completed'])->default('ongoing');
            $table->integer('score')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('mock_interview_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mock_interview_id');
            $table->enum('role', ['user', 'assistant']);
            $table->text('content');
            $table->timestamps();

            $table->foreign('mock_interview_id')->references('id')->on('mock_interviews')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mock_interview_messages');
        Schema::dropIfExists('mock_interviews');
    }
};
