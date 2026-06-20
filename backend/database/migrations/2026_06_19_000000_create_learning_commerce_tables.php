<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_products', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category');
            $table->string('level')->nullable();
            $table->unsignedInteger('price');
            $table->text('description');
            $table->text('outcome');
            $table->unsignedTinyInteger('lesson_count')->default(0);
            $table->string('duration')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->unsignedInteger('seat_limit')->nullable();
            $table->string('meeting_url')->nullable();
            $table->string('material_url')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('learning_orders', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('learning_product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->string('status')->default('pending');
            $table->string('payment_method')->default('manual_transfer');
            $table->text('payment_note')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_orders');
        Schema::dropIfExists('learning_products');
    }
};
