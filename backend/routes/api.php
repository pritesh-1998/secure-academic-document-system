<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\TaskController;
use App\Http\Controllers\SubmissionController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Tasks API
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);

    // Submissions API (The Secure Document Flow)
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::post('/submissions/upload', [SubmissionController::class, 'upload']);
    Route::get('/submissions/{id}/download', [SubmissionController::class, 'download']);
});
