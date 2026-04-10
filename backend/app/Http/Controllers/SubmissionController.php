<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Services\CryptoService;
use App\Services\SimHashService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    protected $crypto;
    protected $simhash;

    public function __construct(CryptoService $crypto, SimHashService $simhash)
    {
        $this->crypto = $crypto;
        $this->simhash = $simhash;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'teacher' || $user->role === 'admin') {
            return Submission::with([
                'student:id,name',
                'task:id,title',
                'matchedSubmission.student:id,name',
            ])->where('teacher_id', $user->id)->get();
        }
        return Submission::with(['task:id,title'])->where('student_id', $user->id)->get();
    }

    public function upload(Request $request)
    {
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'document' => 'required|file',
            'notes' => 'nullable|string'
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

        // 2b. Content Integrity Analysis: Exact + Fuzzy (SimHash) Duplicate Detection
        $existingSubmissions = Submission::where('task_id', $task->id)
            ->where('student_id', '!=', $student->id)
            ->get();

        $integrityFlag     = null;
        $matchSubmissionId = null;

        // Extract text & compute SimHash for fuzzy comparison
        $extractedText   = $this->simhash->extractText($file->getPathname(), $file->getClientMimeType());
        $newSimHash      = $this->simhash->compute($extractedText);

        foreach ($existingSubmissions as $existing) {
            $existingHashHex = explode('|', $existing->document_hash_sha256)[0];

            // Priority 1: Byte-perfect identical file (SHA-256 match)
            if ($existingHashHex === $documentHashHex) {
                $integrityFlag     = 'duplicate_detected';
                $matchSubmissionId = $existing->id;
                break; // Exact match is definitive, no need to continue
            }

            // Priority 2: Fuzzy SimHash similarity (only if no exact match yet)
            if ($integrityFlag === null && $existing->simhash_fingerprint !== null) {
                if ($this->simhash->isSimilar($newSimHash, (int)$existing->simhash_fingerprint)) {
                    $integrityFlag     = 'similar_content_detected';
                    $matchSubmissionId = $existing->id;
                    // Don't break — keep scanning in case there is an exact match later
                }
            }
        }

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
            'notes' => $request->notes,
            'integrity_flag' => $integrityFlag,
            'simhash_fingerprint' => $newSimHash,
            'flagged_match_submission_id' => $matchSubmissionId,
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

            // Update status permanently since validation passed
            $submission->update(['status' => 'verified']);

            // 6. Return Plaintext File Stream
            return response($plaintext, 200, [
                'Content-Type' => $submission->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $submission->original_filename . '"'
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Decryption/Verification Failure: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $student = $request->user();

        // Only students can remove their own submissions
        if ($student->role !== 'student') {
            return response()->json(['error' => 'Only students can remove submissions.'], 403);
        }

        $submission = Submission::findOrFail($id);

        // Ensure the submission belongs to this student
        if ($submission->student_id !== $student->id) {
            return response()->json(['error' => 'Unauthorized to remove this submission.'], 403);
        }

        // Block deletion if teacher has already verified it
        if ($submission->status === 'verified') {
            return response()->json([
                'error' => 'This submission has already been verified by your teacher and cannot be removed.'
            ], 403);
        }

        // Delete encrypted file from disk
        Storage::disk('local')->delete($submission->ciphertext_location);

        // Delete DB record
        $submission->delete();

        return response()->json(['message' => 'Submission successfully removed.'], 200);
    }
}
