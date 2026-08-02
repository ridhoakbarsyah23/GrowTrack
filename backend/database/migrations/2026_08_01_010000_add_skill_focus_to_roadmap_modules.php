<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roadmap_modules', function (Blueprint $table) {
            $table->foreignId('skill_id')
                ->nullable()
                ->after('career_goal_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('roadmap_modules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('skill_id');
        });
    }
};
