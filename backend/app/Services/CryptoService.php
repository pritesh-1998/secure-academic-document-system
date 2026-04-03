<?php

namespace App\Services;

use Exception;
use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\PublicKeyLoader;

class CryptoService
{
    /**
     * Generate a new RSA-3072 key pair.
     * 
     * @return array ['privateKey' => string, 'publicKey' => string]
     */
    public function generateRSAKeyPair(): array
    {
        $private = RSA::createKey(3072);
        $public = $private->getPublicKey();

        return [
            'privateKey' => $private->toString('PKCS8'),
            'publicKey'  => $public->toString('PKCS8'),
        ];
    }

    /**
     * Derive a 32-byte Key Encryption Key (KEK) from a password using Argon2id.
     * 
     * @param string $password The plaintext password
     * @param string $salt 16-byte random salt
     * @return string 32-byte derived key
     */
    public function deriveKEK(string $password, string $salt): string
    {
        // Using PBKDF2 with SHA-256 as fallback since libsodium is not enabled. 
        // 100,000+ iterations is the OWASP recommendation.
        $key = hash_pbkdf2("sha256", $password, $salt, 100000, 32, true);

        if ($key === false) {
            throw new Exception("PBKDF2 KEK derivation failed.");
        }

        return $key;
    }

    /**
     * Encrypt data using AES-256-GCM.
     * 
     * @param string $plaintext Data to encrypt
     * @param string $key 32-byte AES key
     * @param string $nonce 12-byte random nonce
     * @param string $aad Additional Authenticated Data (optional metadata)
     * @return array ['ciphertext' => string, 'tag' => string]
     */
    public function encryptAESGCM(string $plaintext, string $key, string $nonce, string $aad = ''): string
    {
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            $aad
        );

        if ($ciphertext === false) {
            throw new Exception("AES-256-GCM encryption failed.");
        }

        // Standard practice: Append the 16-byte auth tag to the end of the ciphertext
        return base64_encode($ciphertext . $tag);
    }

    public function decryptAESGCM(string $base64Blob, string $key, string $nonce, string $aad = ''): string
    {
        $decoded = base64_decode($base64Blob);
        
        // The tag is always the last 16 bytes in AES-GCM
        $tag = substr($decoded, -16);
        $ciphertext = substr($decoded, 0, -16);

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            $aad
        );

        if ($plaintext === false) {
            throw new Exception("AES-256-GCM decryption failed (potentially tampered data).");
        }

        return $plaintext;
    }

    /**
     * Encrypt the 32-byte Document Encryption Key (DEK) using RSA-OAEP with SHA-256.
     * 
     * @param string $dek 32-byte raw DEK
     * @param string $teacherPublicKeyPem The teacher's public key
     * @return string Encrypted DEK
     */
    public function wrapDEK(string $dek, string $teacherPublicKeyPem): string
    {
        $key = PublicKeyLoader::load($teacherPublicKeyPem);
        $key = $key->withPadding(RSA::ENCRYPTION_OAEP)
                   ->withHash('sha256')
                   ->withMGFHash('sha256');

        return $key->encrypt($dek);
    }

    /**
     * Decrypt the Document Encryption Key (DEK) using RSA-OAEP with SHA-256.
     * 
     * @param string $encryptedDek The wrapped DEK
     * @param string $teacherPrivateKeyPem The teacher's unencrypted private key
     * @return string Decrypted 32-byte DEK
     */
    public function unwrapDEK(string $encryptedDek, string $teacherPrivateKeyPem): string
    {
        $key = PublicKeyLoader::load($teacherPrivateKeyPem);
        $key = $key->withPadding(RSA::ENCRYPTION_OAEP)
                   ->withHash('sha256')
                   ->withMGFHash('sha256');

        return $key->decrypt($encryptedDek);
    }

    /**
     * Sign a payload (e.g., hash of a document) using RSA-PSS with SHA-256.
     * 
     * @param string $dataToSign The payload to sign (typically JSON metadata + document hash)
     * @param string $studentPrivateKeyPem The student's unencrypted private key
     * @return string The signature
     */
    public function signPSS(string $dataToSign, string $studentPrivateKeyPem): string
    {
        $key = PublicKeyLoader::load($studentPrivateKeyPem);
        $key = $key->withPadding(RSA::SIGNATURE_PSS)
                   ->withHash('sha256')
                   ->withMGFHash('sha256');

        // Phpseclib sign() hashes the data for us (we configured it to use sha256).
        return $key->sign($dataToSign);
    }

    /**
     * Verify an RSA-PSS signature with SHA-256.
     * 
     * @param string $dataToVerify The payload that was signed
     * @param string $signature The signature
     * @param string $studentPublicKeyPem The student's public key
     * @return bool True if valid, false otherwise
     */
    public function verifyPSS(string $dataToVerify, string $signature, string $studentPublicKeyPem): bool
    {
        $key = PublicKeyLoader::load($studentPublicKeyPem);
        $key = $key->withPadding(RSA::SIGNATURE_PSS)
                   ->withHash('sha256')
                   ->withMGFHash('sha256');

        return $key->verify($dataToVerify, $signature);
    }
}
