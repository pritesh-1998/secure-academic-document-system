<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Generate 5 Crypto-Compliant Students
        User::factory(5)->create();

        // Let's explicitly create 1 admin and 1 teacher so the User has easy demo access
        User::factory()->create([
            'name' => 'Demo Teacher',
            'email' => 'teacher@example.com',
            'role' => 'teacher',
        ]);
        
        User::factory()->create([
            'name' => 'Demo Admin',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);
    }
}
