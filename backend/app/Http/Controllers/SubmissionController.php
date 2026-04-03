<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    protected $crypto;

    public function __construct(CryptoService $crypto)
    {
        $this->crypto = $crypto;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'teacher' || $user->role === 'admin') {
            return Submission::with(['student:id,name', 'task:id,title'])->where('teacher_id', $user->id)->get();
        }
        return Submission::with(['task:id,title'])->where('student_id', $user->id)->get();
    }

    public function upload(Request $request)
    {
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'document' => 'required|file'
        ]);

        $student = $request->user();
        if ($student->role !== 'student') {
            return response()->json(['error' => 'Only students can upload'], 403);
        }

        $task = Task::findOrFail($request->task_id);
        $teacher = User::findOrFail($task->teacher_id);
        $file = $request->file('document');

        // 1. Get student's private key from cache
        $studentPrivateKey = cache()->get("private_key_user_{$student->id}");
        if (!$studentPrivateKey) {
            return response()->json(['error' => 'Session expired or key unavailable. Please log in again.'], 401);
        }

        // 2. Read file plaintext & hash
        $plaintext = file_get_contents($file->getPathname());
        $documentHash = hash('sha256', $plaintext, true);
        $documentHashHex = bin2hex($documentHash);

        // 3. Generate Crypto Parameters
        $dek = random_bytes(32);
        $nonce = random_bytes(12);

        // 4. Encrypt File (AES-256-GCM)
        $encryptedBlob = $this->crypto->encryptAESGCM($plaintext, $dek, $nonce);

        // 5. Encrypt DEK (RSA-OAEP-SHA256)
        $encryptedDek = $this->crypto->wrapDEK($dek, $teacher->public_key_pem);

        // 6. Sign Metadata Payload (RSA-PSS-SHA256)
        $timestamp = now()->timestamp;
        $payloadToSign = hash('sha256', $student->id . '|' . $teacher->id . '|' . $file->getClientOriginalName() . '|' . $timestamp . '|' . $documentHashHex);
        $signature = $this->crypto->signPSS($payloadToSign, $studentPrivateKey);

        // 7. Store Ciphertext on Disk securely
        $storagePath = 'submissions/' . uniqid() . '.enc';
        Storage::disk('local')->put($storagePath, $encryptedBlob);

        // 8. Save fully compliant record
        $submission = Submission::create([
            'task_id' => $task->id,
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'ciphertext_location' => $storagePath,
            'status' => 'submitted',
            'aes_nonce' => base64_encode($nonce),
            'encrypted_dek' => base64_encode($encryptedDek),
            'signature' => base64_encode($signature),
            // The precise structure to re-build the signature later:
            'document_hash_sha256' => $documentHashHex . '|' . $timestamp, 
        ]);

        return response()->json(['message' => 'Document securely uploaded and encrypted', 'submission' => $submission], 201);
    }

    public function download(Request $request, $id)
    {
        $teacher = $request->user();
        if ($teacher->role !== 'teacher' && $teacher->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $submission = Submission::findOrFail($id);
        if ($submission->teacher_id !== $teacher->id && $teacher->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized to view this submission'], 403);
        }

        // 1. Get teacher's private key from cache
        $teacherPrivateKey = cache()->get("private_key_user_{$teacher->id}");
        if (!$teacherPrivateKey) {
            return response()->json(['error' => 'Session expired or key unavailable. Please log in again.'], 401);
        }

        try {
            // 2. Fetch required crypto variables
            $encryptedDek = base64_decode($submission->encrypted_dek);
            $nonce = base64_decode($submission->aes_nonce);
            $signature = base64_decode($submission->signature);

            // 3. Unwrap DEK (RSA-OAEP-SHA256)
            $dek = $this->crypto->unwrapDEK($encryptedDek, $teacherPrivateKey);

            // 4. Decrypt File (AES-256-GCM)
            $encryptedBlob = Storage::disk('local')->get($submission->ciphertext_location);
            $plaintext = $this->crypto->decryptAESGCM($encryptedBlob, $dek, $nonce);

            // 5. Verify Integrity and Non-repudiation (RSA-PSS-SHA256)
            $student = User::findOrFail($submission->student_id);
            $parts = explode('|', $submission->document_hash_sha256); // [hash, timestamp]
            $documentHashHex = bin2hex(hash('sha256', $plaintext, true));

            if ($documentHashHex !== $parts[0]) {
                throw new \Exception("Document hash mismatch! Potential tampering.");
            }

            $payloadToVerify = hash('sha256', $student->id . '|' . $teacher->id . '|' . $submission->original_filename . '|' . $parts[1] . '|' . $documentHashHex);
            $isValid = $this->crypto->verifyPSS($payloadToVerify, $signature, $student->public_key_pem);

            if (!$isValid) {
                // Return explicitly failed response on tamper detection
                return response()->json(['error' => 'CRITICAL SECURITY ALERT: RSA Signature Verification Failed. The document or metadata has been tampered with or repudiated.'], 403);
            }

            // 6. Return Plaintext File Stream
            return response($plaintext, 200, [
                'Content-Type' => $submission->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $submission->original_filename . '"'
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Decryption/Verification Failure: ' . $e->getMessage()], 500);
        }
    }
}
