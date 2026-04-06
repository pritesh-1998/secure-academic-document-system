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
        // Generate 2 Random Crypto-Compliant Students
        User::factory(2)->create();

        // Generate specific demo students
        User::factory()->create([
            'name' => 'John',
            'email' => 'john@gmail.com',
            'role' => 'student',
            'student_id' => 'STU-3488',
        ]);
        User::factory()->create([
            'name' => 'Jason',
            'email' => 'jason@gmail.com',
            'role' => 'student',
            'student_id' => 'STU-3191',
        ]);
        User::factory()->create([
            'name' => 'Kim',
            'email' => 'kim@gmail.com',
            'role' => 'student',
            'student_id' => 'STU-2761',
        ]);

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
