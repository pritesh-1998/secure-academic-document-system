<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'task_id',
        'student_id',
        'teacher_id',
        'original_filename',
        'mime_type',
        'file_size',
        'ciphertext_location',
        'status',
        'aes_nonce',
        'aes_tag',
        'encrypted_dek',
        'dek_wrap_algorithm',
        'content_algorithm',
        'signature',
        'signature_algorithm',
        'document_hash_sha256',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
