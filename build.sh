#!/bin/bash
set -e

echo "=== Building frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Setting up backend ==="
cd backend
composer install --no-dev --optimize-autoloader
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate --force
touch database/database.sqlite
php artisan migrate --force
cd ..

echo "=== Build complete ==="
