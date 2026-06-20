<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learning_orders', function (Blueprint $table) {
            $table->string('payment_provider')->nullable()->after('payment_method');
            $table->string('payment_reference')->nullable()->after('payment_provider');
            $table->string('payment_url')->nullable()->after('payment_reference');
            $table->json('payment_payload')->nullable()->after('payment_url');
            $table->dateTime('payment_expires_at')->nullable()->after('payment_payload');
        });
    }

    public function down(): void
    {
        Schema::table('learning_orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_provider',
                'payment_reference',
                'payment_url',
                'payment_payload',
                'payment_expires_at',
            ]);
        });
    }
};
