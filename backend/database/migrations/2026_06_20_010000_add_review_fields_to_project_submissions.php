<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_submissions', function (Blueprint $table) {
            $table->text('review_notes')->nullable()->after('score');
            $table->foreignId('reviewer_id')->nullable()->after('review_notes')->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable()->after('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::table('project_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewer_id');
            $table->dropColumn(['review_notes', 'reviewed_at']);
        });
    }
};
