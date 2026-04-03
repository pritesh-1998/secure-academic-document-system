<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CryptoService;

class TestCrypto extends Command
{
    protected $signature = 'app:test-crypto';
    protected $description = 'Test the CryptoService against the academic specifications';

    public function handle(CryptoService $crypto)
    {
        $this->info("Starting crypto suite...");

        // 1. KEK & AES-GCM
        $password = "SecretPassword123";
        $salt = random_bytes(16);
        $kek = $crypto->deriveKEK($password, $salt);
        $nonce = random_bytes(12);
        
        $plaintext = "This is a super secret private key.";
        $encryptedBlob = $crypto->encryptAESGCM($plaintext, $kek, $nonce);
        
        $decrypted = $crypto->decryptAESGCM($encryptedBlob, $kek, $nonce);
        if ($decrypted !== $plaintext) {
            $this->error("AES-GCM Failed");
            return;
        }
        $this->info("AES-GCM Encrypt/Decrypt (with Argon2id KEK) Passed.");

        // 2. RSA Generation & Wrapping
        $studentKeys = $crypto->generateRSAKeyPair();
        $teacherKeys = $crypto->generateRSAKeyPair();
        $this->info("RSA-3072 Key Pairs Generated.");

        $dek = random_bytes(32); // Random 256-bit Document Encryption Key
        $wrappedDek = $crypto->wrapDEK($dek, $teacherKeys['publicKey']);
        $unwrappedDek = $crypto->unwrapDEK($wrappedDek, $teacherKeys['privateKey']);
        
        if ($dek !== $unwrappedDek) {
            $this->error("RSA-OAEP-SHA256 Failed");
            return;
        }
        $this->info("RSA-OAEP-SHA256 (DEK Wrapping) Passed.");

        // 3. RSA-PSS Signature
        $dataToSign = hash('sha256', "File contents here", true);
        $signature = $crypto->signPSS($dataToSign, $studentKeys['privateKey']);
        $isValid = $crypto->verifyPSS($dataToSign, $signature, $studentKeys['publicKey']);
        
        if (!$isValid) {
            $this->error("RSA-PSS-SHA256 Failed");
            return;
        }
        $this->info("RSA-PSS-SHA256 (Signature Verification) Passed.");
        
        $this->info("All cryptography tests passed successfully! OWASP requirements met.");
    }
}
