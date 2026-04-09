#!/bin/bash
set -e

echo "=== Building frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Copying frontend build into Laravel public folder ==="
# Copy static assets (JS, CSS, icons, etc.)
cp -r frontend/dist/assets backend/public/
cp frontend/dist/favicon.svg backend/public/ 2>/dev/null || true
cp frontend/dist/icons.svg backend/public/ 2>/dev/null || true

# Copy index.html as a Blade view so Laravel can serve the SPA
cp frontend/dist/index.html backend/resources/views/spa.blade.php

echo "=== Setting up backend ==="
cd backend
composer install --no-dev --optimize-autoloader
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate --force
touch database/database.sqlite
php artisan migrate --force
cd ..

echo "=== Build complete ==="
