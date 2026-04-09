<?php

use Illuminate\Support\Facades\Route;

// Catch-all: serve the React SPA for any non-API route
Route::get('/{any}', function () {
    return view('spa');
})->where('any', '.*');
