<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->string('education')->nullable()->after('role');
            $table->text('experience_summary')->nullable()->after('current_position');
            $table->text('self_reported_skills')->nullable()->after('experience_summary');
            $table->text('interests')->nullable()->after('self_reported_skills');
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'education',
                'experience_summary',
                'self_reported_skills',
                'interests',
            ]);
        });
    }
};
