<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $password = '1234567890';
        $hashedPassword = static::$password ??= Hash::make($password);
        
        $crypto = app(\App\Services\CryptoService::class);

        // 1. Generate Argon2id salt
        $salt = random_bytes(16);
        $saltHex = bin2hex($salt);

        // 2. Generate RSA-3072 key pair
        // Note: RSA generation is heavy so DB seed may take a few seconds
        $keys = $crypto->generateRSAKeyPair();

        // 3. Derive KEK from "1234567890"
        $kek = $crypto->deriveKEK($password, $salt);

        // 4. Encrypt private key with AES-256-GCM
        $nonce = random_bytes(12);
        $encryptedBlob = $crypto->encryptAESGCM($keys['privateKey'], $kek, $nonce);

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => $hashedPassword,
            'role' => 'student',
            'department' => 'Computer Science',
            'student_id' => 'STU-' . rand(1000, 9999),
            'argon2_salt' => $saltHex,
            'public_key_pem' => $keys['publicKey'],
            'encrypted_private_key_blob' => $encryptedBlob,
            'private_key_nonce' => bin2hex($nonce),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
