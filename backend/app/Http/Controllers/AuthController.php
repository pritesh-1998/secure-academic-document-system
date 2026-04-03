<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Services\CryptoService;

class AuthController extends Controller
{
    protected $crypto;

    public function __construct(CryptoService $crypto)
    {
        $this->crypto = $crypto;
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:student,teacher,admin'
        ]);

        // 1. Generate Argon2id salt (via our PBKDF2 polyfill)
        $salt = random_bytes(16);
        $saltHex = bin2hex($salt);

        // 2. Hash password normally for DB verification
        $passwordHash = Hash::make($request->password);

        // 3. Generate RSA-3072 key pair
        $keys = $this->crypto->generateRSAKeyPair();

        // 4. Derive KEK from password
        $kek = $this->crypto->deriveKEK($request->password, $salt);

        // 5. Encrypt private key with AES-256-GCM
        $nonce = random_bytes(12);
        $encryptedBlob = $this->crypto->encryptAESGCM($keys['privateKey'], $kek, $nonce);

        // 6. Store User
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $passwordHash,
            'role' => $request->role,
            'argon2_salt' => $saltHex,
            'public_key_pem' => $keys['publicKey'],
            'encrypted_private_key_blob' => $encryptedBlob,
            'private_key_nonce' => bin2hex($nonce),
            'department' => $request->department ?? null,
            'student_id' => $request->role === 'student' ? 'STU-' . rand(1000, 9999) : null,
            'employee_id' => $request->role === 'teacher' ? 'EMP-' . rand(1000, 9999) : null,
        ]);

        // 7. Store the Private Key in server memory (Cache) temporarily 
        // tied to this user's session for immediate cryptography ops without requiring re-login
        cache()->put("private_key_user_{$user->id}", $keys['privateKey'], now()->addMinutes(120));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        // 1. Verify standard hash
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // 2. Derive KEK to ensure decryption works
        try {
            $salt = hex2bin($user->argon2_salt);
            $nonce = hex2bin($user->private_key_nonce);
            $kek = $this->crypto->deriveKEK($request->password, $salt);
            
            // Decrypt it into memory temporarily to guarantee correct password
            $privateKey = $this->crypto->decryptAESGCM($user->encrypted_private_key_blob, $kek, $nonce);
            
            // Storing the Private Key in server memory (Cache) temporarily 
            // tied to this user's session for seamless cryptography ops
            cache()->put("private_key_user_{$user->id}", $privateKey, now()->addMinutes(120));
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Key decryption failed. Corrupted key.'], 500);
        }

        $user->update(['last_login' => now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
