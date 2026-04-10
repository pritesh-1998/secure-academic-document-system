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
        Schema::table('submissions', function (Blueprint $table) {
            $table->unsignedBigInteger('simhash_fingerprint')->nullable()->after('integrity_flag');
            $table->unsignedBigInteger('flagged_match_submission_id')->nullable()->after('simhash_fingerprint');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn(['simhash_fingerprint', 'flagged_match_submission_id']);
        });
    }
};
