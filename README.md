# Secure Academic Document System (SecureDoc)
### INSE 6110 — Applied Cryptography · Full Project Documentation

---

## What Is This Project?

**SecureDoc** is a full-stack web application built for academic institutions that need a **cryptographically secure way to submit, store, and verify student assignments**.

Think of it like Google Classroom — but with military-grade encryption baked in at every step. Instead of trusting a third party (like Google) with your documents, every file in this system is:

- 🔐 **Encrypted** so only the correct teacher can read it
- ✍️ **Digitally signed** so the student cannot deny submitting it
- 🔎 **Integrity-verified** so nobody can tamper with it after submission
- 🧬 **Duplicate-checked** using a fuzzy fingerprinting algorithm called SimHash

This documentation covers every feature, every algorithm, and every design decision — from scratch to the final deployed version.

---

## Table of Contents

1. [Security Properties at a Glance](#1-security-properties-at-a-glance)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [API Endpoints](#4-api-endpoints)
5. [Database Schema](#5-database-schema)
6. [Cryptographic Protocol — How It Actually Works](#6-cryptographic-protocol--how-it-actually-works)
7. [SimHash: Fuzzy Duplicate Detection](#7-simhash-fuzzy-duplicate-detection)
8. [File-by-File Code Walkthrough](#8-file-by-file-code-walkthrough)
9. [Frontend Features & Design](#9-frontend-features--design)
10. [Role-Based UI Theming](#10-role-based-ui-theming)
11. [Security Analysis vs. Google Classroom](#11-security-analysis-vs-google-classroom)
12. [Running the Application](#12-running-the-application)
13. [Complete Feature Summary](#13-complete-feature-summary)

---

## 1. Security Properties at a Glance

| Property | What It Means in Plain Language | Algorithm Used |
|---|---|---|
| **Confidentiality** | No one except the teacher can read the submitted file | AES-256-GCM |
| **Key Confidentiality** | The encryption key itself is locked with the teacher's identity | RSA-3072-OAEP-SHA256 |
| **Integrity** | Any tampering with the file after submission is detected | AES-GCM authentication tag + SHA-256 hash |
| **Non-Repudiation** | A student cannot deny having submitted a file — it's mathematically proven | RSA-3072-PSS-SHA256 |
| **Authentication** | Only logged-in users with valid tokens can access protected routes | Laravel Sanctum (Bearer tokens) |
| **Authorization** | Students, teachers, and admins each see only what they are allowed to | Middleware-enforced role checks |
| **Key-at-Rest Protection** | Private keys are never stored in plaintext — ever | PBKDF2-SHA256 (100,000 iterations) → AES-256-GCM |
| **Duplicate Detection (Exact)** | Identical file re-submissions are detected immediately | SHA-256 hash comparison |
| **Duplicate Detection (Fuzzy)** | Modified or paraphrased copy-paste submissions are also detected | SimHash + Hamming distance |

---

## 2. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Framework | Laravel | v12.x |
| Language | PHP | ≥ 8.2 |
| Authentication System | Laravel Sanctum | v4.x |
| Cryptography Library | phpseclib3 | v3.x |
| Database | SQLite | File-based |
| Symmetric Encryption | OpenSSL (via PHP extension) | AES-256-GCM |

### Frontend
| Component | Technology | Version |
|---|---|---|
| UI Framework | React | v19.x |
| Build Tool | Vite | v8.x |
| CSS Framework | Tailwind CSS | v4.x |
| HTTP Client | Axios | v1.x |
| Routing | React Router DOM | v7.x |
| Font | Inter (Google Fonts) | — |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (React SPA)                    │
│  ┌───────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │AuthContext│   │   api.js     │   │  React Pages   │  │
│  │(State Mgmt│◄──│(Axios+Token) │◄──│(Dashboards,    │  │
│  │ + Token)  │   │              │   │ Upload, etc.)  │  │
│  └───────────┘   └──────┬───────┘   └────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │  HTTP/JSON  (Bearer Token Auth)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Laravel 12)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   API Routes                        │ │
│  └───────┬────────────┬──────────────┬────────────────┘ │
│          ▼            ▼              ▼                   │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │AuthController│ │TaskCtrl    │ │SubmissionCtrl     │   │
│  └──────┬───────┘ └─────┬──────┘ └────────┬─────────┘   │
│         │               │                 │              │
│         ▼               ▼                 ▼              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CryptoService (RSA, AES-GCM, PBKDF2, PSS)       │   │
│  │  SimHashService (64-bit fingerprinting)           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────┐  ┌───────────────────────┐ │
│  │  SQLite Database         │  │  File Storage         │ │
│  │  (users, tasks, subs)    │  │  (*.enc ciphertext)   │ │
│  └──────────────────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### How the Two Sides Talk
- **Frontend** runs on `localhost:5000` (Vite dev server) or `localhost:5173`
- **Backend** runs on `localhost:8000` (PHP artisan serve)
- CORS is configured to allow cross-origin requests
- Every request from the frontend automatically includes `Authorization: Bearer {token}` via an Axios request interceptor
- If the server returns a `401 Unauthorized`, the Axios response interceptor clears localStorage and redirects to `/login` automatically

---

## 4. API Endpoints

| Method | Endpoint | Controller | Auth? | Description |
|---|---|---|---|---|
| `POST` | `/api/register` | `AuthController@register` | ❌ | Register with RSA key pair generation |
| `POST` | `/api/login` | `AuthController@login` | ❌ | Login with KEK derivation and private key decryption |
| `POST` | `/api/logout` | `AuthController@logout` | ✅ | Invalidate current Sanctum token |
| `GET` | `/api/user` | Closure | ✅ | Return authenticated user object |
| `GET` | `/api/tasks` | `TaskController@index` | ✅ | List tasks (teachers: own; students: all) |
| `POST` | `/api/tasks` | `TaskController@store` | ✅ Teacher only | Create a new assignment task |
| `GET` | `/api/tasks/{task}` | `TaskController@show` | ✅ | Get a single task with teacher info |
| `GET` | `/api/submissions` | `SubmissionController@index` | ✅ | List submissions (teacher sees received; student sees own) |
| `POST` | `/api/submissions/upload` | `SubmissionController@upload` | ✅ Student only | Encrypt, sign, SimHash, and upload a document |
| `GET` | `/api/submissions/{id}/download` | `SubmissionController@download` | ✅ Teacher/Admin | Decrypt, verify integrity, verify signature, download |
| `DELETE` | `/api/submissions/{id}` | `SubmissionController@destroy` | ✅ Student only | Remove own unverified submission |

---

## 5. Database Schema

### 5.1 Users Table

```sql
CREATE TABLE users (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                        VARCHAR(255) NOT NULL,
    email                       VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at           TIMESTAMP NULL,
    password                    VARCHAR(255) NOT NULL,   -- Bcrypt hash (12 rounds)

    -- Cryptographic Material --
    pbkdf2_salt                 VARCHAR(32) NULL,        -- 16-byte random salt as hex (used for KEK derivation)
    public_key_pem              TEXT NULL,               -- RSA-3072 public key (PKCS8/PEM) - safe to store openly
    encrypted_private_key_blob  TEXT NULL,               -- AES-256-GCM encrypted private key (base64)
    private_key_nonce           VARCHAR(255) NULL,       -- 12-byte AES-GCM nonce as hex

    -- Role & Metadata --
    role                        ENUM('student','teacher','admin') DEFAULT 'student',
    student_id                  VARCHAR(255) NULL,       -- e.g., STU-1234
    employee_id                 VARCHAR(255) NULL,       -- e.g., EMP-5678
    department                  VARCHAR(255) NULL,
    phone                       VARCHAR(255) NULL,
    last_login                  TIMESTAMP NULL,
    remember_token              VARCHAR(100),
    created_at                  TIMESTAMP,
    updated_at                  TIMESTAMP
);
```

> **Note on the salt column name:** The column is named `argon2_salt` in the database for historical reasons, but it is used exclusively as the PBKDF2 salt — **Argon2 is not used anywhere in this system**. All password-based key derivation uses **PBKDF2-SHA256 with 100,000 iterations**.

### 5.2 Tasks Table

```sql
CREATE TABLE tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    deadline    DATE NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);
```

### 5.3 Submissions Table (Full Schema Including New Columns)

```sql
CREATE TABLE submissions (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id                     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    student_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- File Metadata --
    original_filename           VARCHAR(255) NOT NULL,
    mime_type                   VARCHAR(255) NOT NULL,
    file_size                   BIGINT UNSIGNED NOT NULL,
    ciphertext_location         VARCHAR(255) NOT NULL,    -- Disk path e.g. submissions/abc123.enc
    status                      VARCHAR(255) DEFAULT 'submitted', -- submitted | verified

    -- Teacher Notes --
    notes                       TEXT NULL,               -- Optional notes added by student at submission time

    -- AES-256-GCM Parameters --
    aes_nonce                   VARCHAR(32) NOT NULL,    -- 12-byte nonce, base64 encoded
    aes_tag                     VARCHAR(64) NULL,        -- Optional separate tag storage
    encrypted_dek               TEXT NOT NULL,           -- RSA-OAEP wrapped AES key, base64 encoded
    dek_wrap_algorithm          VARCHAR(255) DEFAULT 'RSA-OAEP-SHA256',
    content_algorithm           VARCHAR(255) DEFAULT 'AES-256-GCM',

    -- Digital Signature --
    signature                   TEXT NOT NULL,           -- RSA-PSS signature, base64 encoded
    signature_algorithm         VARCHAR(255) DEFAULT 'RSA-PSS-SHA256',
    document_hash_sha256        VARCHAR(64) NOT NULL,    -- SHA-256 hex of original file + "|" + Unix timestamp

    -- Integrity / Duplicate Detection --
    integrity_flag              VARCHAR(255) NULL,       -- NULL | 'duplicate_detected' | 'similar_content_detected'
    simhash_fingerprint         BIGINT UNSIGNED NULL,    -- 64-bit SimHash fingerprint of document text
    flagged_match_submission_id INTEGER NULL,            -- Points to the submission this was matched against

    created_at                  TIMESTAMP,
    updated_at                  TIMESTAMP
);
```

**What each new column means:**
- `notes` — A student can optionally attach a plain-text note when submitting (e.g., "This is my final version").
- `integrity_flag` — Set automatically by the server during upload. `duplicate_detected` means the file is byte-for-byte identical to another student's submission on the same task. `similar_content_detected` means the SimHash fingerprint is close enough (≤ 10 bits different) to flag potential plagiarism.
- `simhash_fingerprint` — A 64-bit integer representing the "content fingerprint" of the document. Two documents with similar wording will have similar fingerprints.
- `flagged_match_submission_id` — If a duplicate or similar submission was found, this points to the original submission that triggered the flag, allowing the teacher to compare both side-by-side.

---

## 6. Cryptographic Protocol — How It Actually Works

### 6.1 Registration — Setting Up a User's Crypto Identity

When a new user registers, the system doesn't just create an account — it creates a **cryptographic identity**:

```
Registration(name, email, password, role):

  Step 1:  salt ← random_bytes(16)
           → A unique 16-byte random value — ensures two users with the same
             password will still have completely different encryption keys

  Step 2:  password_hash ← Bcrypt(password, rounds=12)
           → Standard password hashing for login verification (separate from crypto)

  Step 3:  (PrivateKey, PublicKey) ← RSA.KeyGen(3072 bits)
           → Generates an RSA key pair. PublicKey is safe to share openly.
             PrivateKey must be protected at all costs.

  Step 4:  KEK ← PBKDF2(SHA-256, password, salt, iterations=100,000, length=32 bytes)
           → Key Encryption Key — a 256-bit key derived from the user's password.
             The 100,000 iterations make brute-force attacks impractical.

  Step 5:  nonce ← random_bytes(12)
           → A one-time 96-bit number used by AES-GCM

  Step 6:  encrypted_PrivateKey ← AES-256-GCM.Encrypt(PrivateKey, KEK, nonce)
           → We encrypt the private key itself using the password-derived KEK
             so it can be safely stored in the database

  Step 7:  Store in DB: name, email, password_hash, role,
                         hex(salt), PublicKey, base64(encrypted_PrivateKey), hex(nonce)

  Step 8:  Cache.put("private_key_user_{id}", PrivateKey, TTL=120 minutes)
           → Keep the raw private key in server memory for 2 hours so the
             user doesn't need to re-authenticate for every operation

  Step 9:  token ← Sanctum.CreateToken(user)
  Step 10: Return (token, user_info)
```

**Why can't someone just steal the database and read private keys?**
Because the private key is encrypted with a key (KEK) that was derived from the user's password using 100,000 rounds of PBKDF2. Without the password, you cannot reconstruct the KEK, and without the KEK, you cannot decrypt the private key.

---

### 6.2 Login — Re-deriving the Key

```
Login(email, password):

  Step 1:  user ← DB.FindByEmail(email)
  Step 2:  Verify Bcrypt(password, user.password_hash)    → standard auth check

  Step 3:  salt ← hex2bin(user.pbkdf2_salt)
  Step 4:  nonce ← hex2bin(user.private_key_nonce)

  Step 5:  KEK ← PBKDF2(SHA-256, password, salt, 100,000 iterations, 32 bytes)
           → Re-derive the exact same KEK used during registration

  Step 6:  PrivateKey ← AES-256-GCM.Decrypt(user.encrypted_PrivateKey, KEK, nonce)
           → If the password was wrong, the KEK will be wrong, and AES-GCM's
             authentication tag will fail — meaning the system rejects the login
             with a 500 error, not just "wrong password"

  Step 7:  Cache.put("private_key_user_{id}", PrivateKey, TTL=120 minutes)
  Step 8:  Update last_login timestamp
  Step 9:  token ← Sanctum.CreateToken(user)
  Step 10: Return (token, user_info)
```

---

### 6.3 Document Upload — The Complete Encryption & Signing Pipeline

This is the most important part of the system. When a student uploads a file:

```
Upload(task_id, document_file, notes):
  Student = currently logged-in user (must be role='student')
  Teacher = the teacher who created this task

  ── STEP A: Read the File ─────────────────────────────────────────────
  1. plaintext ← file contents (raw bytes)
  2. document_hash_hex ← SHA-256(plaintext)  →  stored for integrity checks later

  ── STEP B: Duplicate and Plagiarism Check ────────────────────────────
  3. extracted_text ← SimHashService.extractText(file)
     → Reads plain text from .txt, .pdf, or .docx files
  4. new_fingerprint ← SimHashService.compute(extracted_text)
     → Computes a 64-bit SimHash of the document content
  5. For each other student's submission on the same task:
       a. If SHA-256 hashes match → flag as 'duplicate_detected' (exact copy)
       b. If Hamming distance between SimHashes ≤ 10 bits → flag as 'similar_content_detected'
     → Record the flagged match's submission ID for the teacher to investigate

  ── STEP C: Symmetric Encryption (Confidentiality) ───────────────────
  6. DEK ← random_bytes(32)   → One fresh 256-bit AES key per submission
  7. nonce ← random_bytes(12) → One fresh 96-bit GCM nonce per submission
  8. ciphertext || tag ← AES-256-GCM.Encrypt(plaintext, DEK, nonce)

  ── STEP D: Key Wrapping (Key Confidentiality) ───────────────────────
  9. encrypted_DEK ← RSA-OAEP-SHA256.Encrypt(DEK, Teacher.PublicKey)
     → The AES key is now "locked" — only the teacher's RSA private key can open it

  ── STEP E: Digital Signature (Non-Repudiation) ──────────────────────
  10. timestamp ← Unix timestamp of now()
  11. payload ← SHA-256(student_id + "|" + teacher_id + "|" + filename + "|"
                        + timestamp + "|" + document_hash_hex)
  12. signature ← RSA-PSS-SHA256.Sign(payload, Student.PrivateKey)
      → This cryptographically binds the student's identity to this exact file
        at this exact moment. It cannot be forged or denied.

  ── STEP F: Storage ──────────────────────────────────────────────────
  13. Save ciphertext to disk as "submissions/{random_id}.enc"
  14. Save to DB: all metadata, encrypted_DEK, signature, notes,
                   integrity_flag, simhash_fingerprint, flagged_match_id
  15. Return 201 Created
```

---

### 6.4 Document Download — Decryption & Full Verification

When a teacher clicks "Download & Verify":

```
Download(submission_id):
  Teacher = currently logged-in user (must be role='teacher' or 'admin')

  ── STEP A: Key Unwrapping ───────────────────────────────────────────
  1. encrypted_DEK ← base64_decode(submission.encrypted_dek)
  2. DEK ← RSA-OAEP-SHA256.Decrypt(encrypted_DEK, Teacher.PrivateKey)
     → Only the correct teacher's private key can recover the AES key

  ── STEP B: Decryption ───────────────────────────────────────────────
  3. ciphertext_blob ← read file from disk
  4. plaintext ← AES-256-GCM.Decrypt(ciphertext_blob, DEK, nonce)
     ✅ INTEGRITY CHECK #1: GCM automatically verifies its authentication tag.
        If even 1 byte on disk was changed, this fails immediately.

  ── STEP C: Hash Verification ────────────────────────────────────────
  5. computed_hash ← SHA-256(plaintext)
  6. stored_hash ← first part of submission.document_hash_sha256 (before "|")
  7. Assert computed_hash == stored_hash
     ✅ INTEGRITY CHECK #2: Confirms the decrypted file matches what was
        originally uploaded. Any corruption or tampering is caught here.

  ── STEP D: Signature Verification ──────────────────────────────────
  8. timestamp ← second part of submission.document_hash_sha256 (after "|")
  9. payload ← SHA-256(student_id + "|" + teacher_id + "|" + filename + "|"
                       + timestamp + "|" + computed_hash)
  10. valid ← RSA-PSS-SHA256.Verify(payload, signature, Student.PublicKey)
     ✅ INTEGRITY CHECK #3: Confirms the document was signed by the student.
        If !valid → Return 403 "CRITICAL: RSA Signature Verification Failed"

  ── STEP E: Status Update & Delivery ─────────────────────────────────
  11. submission.status ← 'verified'   → Permanently marks it as teacher-verified
  12. Return plaintext as downloadable file with correct MIME type and filename
```

**Three independent checks** protect every download. If any one of them fails, the download is blocked and an alert is shown.

---

## 7. SimHash: Fuzzy Duplicate Detection

SimHash is the algorithm that catches **modified plagiarism** — where a student copies another student's work and changes a few words. Regular SHA-256 would miss this entirely because even one changed character produces a completely different hash. SimHash solves this.

### How SimHash Works (Step by Step)

**Step 1 — Normalize the text**
Lowercase everything, remove punctuation, collapse whitespace. "The Quick Brown Fox!" → "the quick brown fox"

**Step 2 — Tokenize into words and bigrams**
Split into individual words AND pairs of adjacent words:
- Words: `["the", "quick", "brown", "fox"]`
- Bigrams: `["the_quick", "quick_brown", "brown_fox"]`

Bigrams make the algorithm more sensitive to word order, catching things like "the system is secure" vs "the secure system is".

**Step 3 — Hash each token with CRC32**
Each token produces a 32-bit hash. We extend it to 64 bits for a larger fingerprint space.

**Step 4 — Build a weighted bit vector**
Start with a 64-element array of zeros. For each bit position:
- If the token's hash has a `1` in that position → add +1 to the vector
- If it has a `0` → add -1 to the vector

**Step 5 — Collapse to a single fingerprint**
For each position: if the vector value is positive → fingerprint bit = 1, otherwise = 0.

**Step 6 — Compare using Hamming distance**
XOR the two fingerprints. Count the number of 1-bits in the result. This count is the Hamming distance — how many bit positions differ.

```
Our threshold: ≤ 10 bits different out of 64 ≈ 84% similarity → flagged as "similar_content_detected"
```

### Why This Matters
| Scenario | SHA-256 | SimHash |
|---|---|---|
| Exact copy (byte-for-byte) | ✅ Detected | ✅ Detected (distance = 0) |
| Changed 5 words | ❌ Missed — completely different hash | ✅ Detected (small distance) |
| Paraphrased paragraph | ❌ Missed | ✅ Likely detected (medium distance) |
| Different topic entirely | ❌ Missed (as expected) | ✅ Not flagged (large distance) |

### Supported File Types
The SimHash service can extract text from:
- `.txt` — Direct read
- `.pdf` — Regex-based BT/ET stream extraction
- `.docx` — ZIP extraction → `word/document.xml` → strip XML tags

---

## 8. File-by-File Code Walkthrough

### 8.1 `CryptoService.php` — The Cryptography Engine
All cryptographic operations are encapsulated in one place. Nothing cryptographic happens outside this file.

| Method | Algorithm | What It Does |
|---|---|---|
| `generateRSAKeyPair()` | RSA-3072, PKCS8 | Generates a fresh RSA key pair using phpseclib3 |
| `deriveKEK()` | PBKDF2-SHA256, 100K iterations | Turns a password + salt into a 256-bit encryption key |
| `encryptAESGCM()` | AES-256-GCM | Encrypts data; returns base64(ciphertext ∥ auth_tag) |
| `decryptAESGCM()` | AES-256-GCM | Decrypts data; last 16 bytes are the authentication tag |
| `wrapDEK()` | RSA-OAEP-SHA256 | Encrypts a small AES key using a RSA public key |
| `unwrapDEK()` | RSA-OAEP-SHA256 | Decrypts the AES key using the RSA private key |
| `signPSS()` | RSA-PSS-SHA256 | Creates a digital signature using a private key |
| `verifyPSS()` | RSA-PSS-SHA256 | Verifies a signature using a public key |

**Design notes:**
- The GCM authentication tag (16 bytes) is appended to the ciphertext before base64 encoding. During decryption, the last 16 bytes are peeled off as the tag.
- Both the hash function and MGF (Mask Generation Function) are set to SHA-256 for all RSA operations.
- phpseclib3 is used instead of raw OpenSSL because it provides a cleaner, safer API for RSA-OAEP and RSA-PSS.

---

### 8.2 `SimHashService.php` — Fuzzy Duplicate Detector
Implements 64-bit SimHash fingerprinting for near-duplicate detection.

| Method | What It Does |
|---|---|
| `compute(string $text): int` | Normalizes, tokenizes, hashes tokens, and collapses to a 64-bit integer fingerprint |
| `hammingDistance(int $a, int $b): int` | XORs two fingerprints and counts differing bits |
| `isSimilar(int $a, int $b): bool` | Returns `true` if Hamming distance is ≤ 10 (configurable threshold) |
| `extractText(string $filePath, string $mimeType): string` | Extracts plain text from .txt, .pdf, or .docx |

**Similarity threshold:** `SIMILARITY_THRESHOLD = 10` bits out of 64. This means approximately 84% of bits must match — documents with very similar wording will cross this threshold.

---

### 8.3 `AuthController.php` — Registration & Login

**Registration (the important crypto part):**
1. Generate 16 random bytes for the PBKDF2 salt
2. Hash the password with Bcrypt (for login verification — separate from crypto)
3. Generate an RSA-3072 key pair
4. Derive a 256-bit KEK from the password using PBKDF2 (100K iterations)
5. Encrypt the private key with AES-256-GCM using the KEK
6. Store everything: the public key openly, the encrypted private key + salt + nonce in the DB
7. Cache the raw private key in server memory for 120 minutes
8. Return a Sanctum bearer token

**Login (re-deriving the key):**
1. Standard Bcrypt password check
2. Re-derive the KEK from the login password using the stored salt
3. Decrypt the stored private key blob with AES-256-GCM
4. If decryption fails (wrong password = wrong KEK = GCM tag mismatch) → return error
5. Cache the private key, update `last_login`, return token

---

### 8.4 `SubmissionController.php` — Upload, Download, Delete

**Upload flow:**
1. Validate request (task_id, document file, optional notes)
2. Read the file, compute SHA-256 hash
3. **Run SimHash duplicate detection** against all other submissions on the same task
4. Generate a fresh DEK (32 bytes) and AES nonce (12 bytes)
5. Encrypt the file content with AES-256-GCM
6. Wrap the DEK with the teacher's RSA public key (OAEP)
7. Sign the metadata payload with the student's RSA private key (PSS)
8. Save ciphertext to disk, save all metadata + crypto material + integrity flags to DB

**Download flow:**
1. Verify requester is a teacher/admin and owns this submission
2. Unwrap the DEK using the teacher's RSA private key (from cache)
3. Decrypt the file using AES-256-GCM (integrity check #1: GCM tag)
4. Recompute SHA-256 and compare against stored hash (integrity check #2)
5. Reconstruct the signature payload and verify the RSA-PSS signature (integrity check #3)
6. Update `status = 'verified'`
7. Stream the decrypted file back as a download

**Delete flow (new):**
- Only students can delete their own submissions
- Deletion is **blocked** if the teacher has already verified the submission (`status = 'verified'`)
- On successful delete: removes both the encrypted file from disk and the DB record

---

### 8.5 `TaskController.php` — Assignment Management

Simple CRUD for tasks:
- `index()`: Teachers see only their own tasks; students see all tasks with teacher name
- `store()`: Only teachers and admins can create tasks
- `show()`: Any authenticated user can fetch a single task with teacher info

---

### 8.6 `UserFactory.php` — Database Seeding

The seeder uses the **real `CryptoService`** to generate cryptographically valid test users. Each seeded user:
- Gets a unique RSA-3072 key pair (makes seeding slow but realistic)
- Has their private key properly encrypted with AES-256-GCM
- Uses password `"1234567890"` as the KEK derivation input

---

## 9. Frontend Features & Design

### 9.1 `AuthContext.jsx` — Authentication State
- Persists the user object and Sanctum token in `localStorage` for page refresh persistence
- Provides `login()`, `register()`, `logout()` functions to all child components via React Context
- On logout: clears localStorage and calls the server logout endpoint to invalidate the token

### 9.2 `api.js` — Axios Configuration
- Base URL: `http://localhost:8000/api`
- **Request interceptor**: Attaches `Authorization: Bearer {token}` to every request automatically
- **Response interceptor**: On 401, clears localStorage and redirects to `/login` for global session expiry

### 9.3 `App.jsx` — Routing
- **Public routes**: `/login`, `/register`, `/reset-password`
- **Protected routes**: Wrapped in `ProtectedPage` (auth + role check + sidebar layout)
- `DashboardRouter` renders the correct dashboard based on `user.role`
- Any unknown URL redirects to `/login`

### 9.4 `UploadAssignment.jsx` — Student File Upload
- **Drag-and-drop** file selection with visual hover feedback
- Optional **notes field** — students can attach a message with their submission
- **Cryptographic animation**: Simulates 6 client-side crypto steps with 600ms delays each to visually explain what's happening (AES key generation, GCM encryption, RSA wrapping, PSS signing, etc.)
- Post-upload success screen summarizes all algorithms used

### 9.5 `StudentDashboard.jsx` — Student Home
- Shows task completion progress (e.g., "2/3 assignments submitted")
- Lists all available assignments with deadlines and status badges
- Shows the student's own submissions with their current status (`submitted` / `verified`)
- **Delete button** appears on unverified submissions — disappears once the teacher verifies
- If a submission was flagged for duplication, shows an integrity warning badge

### 9.6 `TeacherDashboard.jsx` — Teacher Home
- **Two-tab interface**: "Assignment Tracking" (overview of all tasks and student progress) and "Cryptographic Submissions" (decrypt and verify)
- **Cryptographic verification animation**: Step-by-step log during download showing:
  - RSA-OAEP key unwrapping
  - AES-256-GCM decryption
  - GCM tag authentication
  - SHA-256 hash comparison
  - RSA-PSS signature verification
- If any submission has an `integrity_flag`, the teacher sees a warning label showing "Duplicate Detected" or "Similar Content" with a link to the matched submission
- On verification failure: displays a critical red alert banner
- On success: updates the submission's status card to "Verified ✅"

### 9.7 `Profile.jsx` — User Profile
- Email and phone number are **masked by default** (e.g., `j***@***.com`)
- Click the 👁 eye icon to temporarily reveal — auto-hides again after 10 seconds
- Role-specific colored avatar badge (blue for student, purple for teacher, amber for admin)

### 9.8 `CreateTask.jsx` — Task Creation (Teacher)
- Simple form for title, description, and deadline
- Only accessible to teachers and admins (enforced on both frontend route and backend API)

---

## 10. Role-Based UI Theming

The system uses a different visual identity depending on who is logged in, making it immediately clear which role you are operating under.

### Design Tokens (defined in `index.css` via Tailwind v4 `@theme`)

| Token | Color | Used For |
|---|---|---|
| `--color-primary` | `#0d9488` (Teal) | Primary buttons, links, active states |
| `--color-student` | `#3b82f6` (Blue) | Student badges, student dashboard accents |
| `--color-teacher` | `#8b5cf6` (Purple) | Teacher badges, teacher dashboard accents |
| `--color-admin` | `#f59e0b` (Amber) | Admin badges and indicators |
| `--color-success` | `#10b981` (Emerald) | Verified status, success alerts |
| `--color-warning` | `#f59e0b` (Amber) | Pending status, integrity warnings |
| `--color-danger` | `#ef4444` (Red) | Errors, overdue deadlines, security alerts |
| `--color-sidebar` | `#1e293b` (Slate-800) | Sidebar background |
| `--color-bg` | `#f8fafc` (Slate-50) | Page background |

The sidebar navigation items, avatar badges, and dashboard stat cards all use the role-specific color to create a visually distinct experience per role.

---

## 11. Security Analysis vs. Google Classroom

| Security Property | Google Classroom | Our System |
|---|---|---|
| Document encryption | ❌ Google can read all files | ✅ AES-256-GCM, only teacher can decrypt |
| Digital signatures | ❌ No cryptographic authorship proof | ✅ RSA-3072-PSS per submission |
| Non-repudiation | ❌ No proof student actually submitted | ✅ Mathematically bound signature |
| Private key protection | ❌ Google manages all keys | ✅ Keys encrypted with PBKDF2-derived KEK |
| Integrity verification | ❌ Trust-based, no cryptographic check | ✅ GCM tag + SHA-256 + RSA-PSS |
| Plagiarism detection | ❌ Manual or paid third-party (Turnitin) | ✅ Built-in SimHash + SHA-256 |
| Student submission retraction | ❌ Not available | ✅ Students can delete before verification |
| Cryptographic transparency | ❌ Black box | ✅ Step-by-step visual during upload/download |

### Why Our System Is Cryptographically Superior

**Scenario: Database Breach**
An attacker steals the entire database. With Google Classroom, all content is readable. With our system, the attacker gets:
- AES-256-GCM encrypted files (unreadable without the DEK)
- RSA-OAEP wrapped DEKs (unreadable without the teacher's private key)
- AES-256-GCM encrypted private keys (unreadable without the PBKDF2-derived KEK)
- PBKDF2 KEKs that require the user's password + 100,000 iterations to crack

**Result: zero documents readable, even with full database access.**

**Scenario: Disputed Submission**
A student claims they never submitted. With Google Classroom, this is a he-said/she-said situation. With our system, the RSA-PSS signature is mathematically undeniable — it was created using the student's private key (only accessible with their password at login time). This is **non-repudiation** — a legally recognized form of digital evidence.

**Scenario: Malicious Teacher**
A corrupt teacher modifies a student's file after receiving it. Our three-layer protection stops this:
1. The AES-GCM authentication tag breaks if any byte on disk changes
2. The SHA-256 hash comparison fails if the content doesn't match what was hashed at upload
3. The RSA-PSS signature fails if the content doesn't match what was signed

**Known Limitations (honest assessment):**
1. **Server-side key caching**: The decrypted private key lives in server memory for 120 minutes. A server memory dump during that window could expose it.
2. **No true client-side encryption**: Files travel over HTTPS to the server before encryption. True E2E would require JavaScript crypto in the browser.
3. **Password reset not connected**: The frontend has a reset password UI, but the backend endpoint is not implemented. Changing a password would require re-encrypting all stored private keys.
4. **No key rotation**: There is no procedure to rotate RSA keys or re-wrap existing DEKs with new keys.

---

## 12. Running the Application

### Backend Setup
```bash
cd backend
composer install
php artisan migrate        # Creates all tables including simhash columns
php artisan db:seed        # Creates 5 students + 1 teacher + 1 admin with real RSA keys
php artisan serve          # Starts on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:5000
```

### Demo Credentials (from database seeder)
| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@example.com` | `1234567890` |
| Admin | `admin@example.com` | `1234567890` |
| Student 1 | `student1@example.com` | `1234567890` |
| Student 2–5 | *(email from seeder)* | `1234567890` |

---

## 13. Complete Feature Summary

| Feature | Status | Notes |
|---|---|---|
| User Registration with RSA-3072 Key Generation | ✅ Complete | Full crypto setup on every new account |
| User Login with PBKDF2 Key Derivation | ✅ Complete | Re-derives KEK, decrypts private key, caches for 120 min |
| Role-Based Dashboards (Student / Teacher / Admin) | ✅ Complete | Each role sees a different interface |
| Task CRUD (Teachers Create, Students View) | ✅ Complete | With deadlines and descriptions |
| Secure Document Upload (AES + RSA + PSS) | ✅ Complete | Full encryption + signing pipeline on every upload |
| Secure Document Download (Decrypt + Verify) | ✅ Complete | Three-layer verification on every download |
| Exact Duplicate Detection (SHA-256) | ✅ Complete | Byte-for-byte copy detected at upload time |
| Fuzzy Duplicate Detection (SimHash) | ✅ Complete | Near-duplicate / paraphrased content flagged with 64-bit fingerprint |
| Duplicate Flag Display for Teachers | ✅ Complete | "Duplicate Detected" / "Similar Content" badges with match info |
| Student Submission Notes | ✅ Complete | Optional text note attached at submission |
| Student Submission Deletion | ✅ Complete | Allowed only before teacher verification |
| Verified Submission Lock | ✅ Complete | Once teacher verifies, student cannot delete |
| Submission Status Tracking (submitted → verified) | ✅ Complete | Status updated automatically on download/verify |
| Cryptographic Progress Visualization (Upload) | ✅ Complete | Animated step-by-step during upload |
| Cryptographic Progress Visualization (Download) | ✅ Complete | Animated step-by-step during teacher verification |
| Role-Based UI Theming | ✅ Complete | Blue for student, purple for teacher, amber for admin |
| Profile with PII Masking | ✅ Complete | Email/phone masked, reveal on click, auto-hide after 10s |
| Password Strength Meter | ✅ Complete | Visual indicator at registration |
| Protected Routes + Role Guards | ✅ Complete | Frontend route protection enforced per role |
| Token-Based Authentication (Sanctum) | ✅ Complete | Bearer token with global 401 auto-redirect |
| Password Reset Flow | ⚠️ Partial | Frontend UI complete; backend endpoint not connected |
| Admin User Management | ⚠️ Partial | Shows system-wide stats; no user CRUD |
