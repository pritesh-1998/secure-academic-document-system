<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade'); // The teacher intended to decrypt
            
            // Standard Metadata
            $table->string('original_filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('ciphertext_location');
            $table->string('status')->default('uploaded');
            
            // Cryptographic Metadata
            $table->string('aes_nonce', 32); // 12-byte nonce (base64)
            $table->string('aes_tag', 64)->nullable(); // Optional if tag is stored separate from ciphertext payload
            $table->text('encrypted_dek'); // DEK wrapped with RSA-OAEP-SHA256
            $table->string('dek_wrap_algorithm')->default('RSA-OAEP-SHA256');
            $table->string('content_algorithm')->default('AES-256-GCM');
            
            // Authenticity & Non-repudiation
            $table->text('signature'); // RSA-PSS signature
            $table->string('signature_algorithm')->default('RSA-PSS-SHA256');
            $table->string('document_hash_sha256', 64); // SHA-256 hex string

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
