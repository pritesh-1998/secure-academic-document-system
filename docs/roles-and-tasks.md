# Secure Academic Document System — Roles & Tasks

> **Course:** INSE 6110  
> **Project:** Secure Academic Document System (SecureDoc)  
> **Date:** April 5, 2026

---

## Overview

The Secure Academic Document System is a web-based platform that leverages modern cryptographic algorithms (AES-256-GCM, RSA-3072-OAEP, RSA-PSS) to securely manage the lifecycle of academic document submissions. The system implements **Role-Based Access Control (RBAC)** with three distinct roles: **Admin**, **Teacher**, and **Student**. Each role has a unique set of permissions, accessible pages, and responsibilities within the system.

---

## 1. Student Role

### 1.1 Description
The **Student** is the primary document submitter in the system. Students upload academic assignments that are encrypted at the point of submission and digitally signed to guarantee authenticity and non-repudiation.

### 1.2 Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | Overview of tasks, submissions, and deadlines |
| Upload Assignment | `/upload` | Securely upload encrypted documents |
| Profile | `/profile` | View and edit personal information |

### 1.3 Tasks & Responsibilities

#### A. Registration & Key Generation
- Register by providing **name**, **email**, **password**, and selecting the **Student** role.
- Upon registration, the backend automatically:
  - Generates a **RSA-3072 key pair** (public + private key).
  - Derives a **Key Encryption Key (KEK)** from the password using **PBKDF2/Argon2id**.
  - Encrypts the private key with **AES-256-GCM** and stores the encrypted blob in the database.
  - Stores the **public key** (in PEM format) in the user record for future signature verification.
- A **Student ID** (e.g., `STU-4521`) is automatically assigned.

#### B. Login & Key Recovery
- Log in with email and password.
- The backend re-derives the KEK from the password and decrypts the student's private key from the database.
- The decrypted private key is stored temporarily in server memory (cache) for **120 minutes** to support cryptographic operations during the session.

#### C. View Dashboard
- See **total tasks** assigned by teachers, the number of **submitted** assignments, and **pending** (not yet submitted) assignments.
- View an **alert bar** indicating:
  - 🔴 Overdue assignments (past deadline).
  - 🟡 Pending assignments (deadline upcoming).
  - 🟢 All caught up (nothing pending).
- Browse the list of **upcoming assignments** sorted by deadline, with urgency indicators showing days remaining.
- Review a table of **past submissions** showing: Task name, File name, Date submitted, and cryptographic status (e.g., "🔒 AES Encrypted").

#### D. Upload Assignment (Secure Submission)
- Select an assignment (task) from a dropdown list of tasks created by teachers.
- Upload a document file (PDF, DOCX, ZIP, images) via a drag-and-drop zone or file browser.
- Upon clicking **"Commence Secure Upload"**, the following cryptographic pipeline executes:
  1. **Read** the physical file stream.
  2. **Generate** a random 256-bit AES-GCM Data Encryption Key (DEK).
  3. **Encrypt** the file plaintext with AES-256-GCM using the DEK.
  4. **Hash** the ciphertext and **sign** it with the student's RSA-PSS private key.
  5. **Wrap** the DEK with the teacher's RSA-3072 public key (RSA-OAEP).
  6. **Transmit** the entire cryptographic payload to the server.
- The UI displays a real-time **Cryptographic Engine** loader showing each step as it completes.
- Upon success, a confirmation card shows the file name, size, algorithms used, and encrypted status.

#### E. Manage Profile
- View personal information: name, masked email, masked phone, role, Student ID, department, join date, and last login.
- Edit name and department fields.
- Temporarily reveal sensitive fields (email, phone) with an auto-hide after 10 seconds.

---

## 2. Teacher Role

### 2.1 Description
The **Teacher** is the assignment creator and document verifier. Teachers create tasks for students, receive encrypted submissions, and can decrypt and cryptographically verify each submission's integrity and authenticity.

### 2.2 Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | Overview with assignment tracking and submission tables |
| Students (Submissions) | `/students` | Detailed view of student submissions |
| Create Task | `/create-task` | Create new assignment tasks for students |
| Profile | `/profile` | View and edit personal information |

### 2.3 Tasks & Responsibilities

#### A. Registration & Key Generation
- Register by providing **name**, **email**, **password**, and selecting the **Teacher** role.
- Identical cryptographic key generation as students:
  - RSA-3072 key pair generated.
  - Private key encrypted with AES-256-GCM (KEK derived from password).
  - Public key stored in PEM format (used by students to wrap DEKs during upload).
- An **Employee ID** (e.g., `EMP-7832`) is automatically assigned.

#### B. Login & Key Recovery
- Same secure login flow as students — the private key is decrypted from storage and cached in server memory for 120 minutes.
- The teacher's private key is essential for **unwrapping** (decrypting) the DEK that was wrapped with the teacher's public key.

#### C. View Dashboard
- See four key statistics:
  - **Assignments Created** — total number of tasks created by this teacher.
  - **Active Students** — unique students who have submitted at least one assignment.
  - **Total Submissions** — total number of submissions received.
  - **Pending Verification** — submissions that have not yet been decrypted/verified.
- **Assignment Tracking tab**: A table listing all tasks with Task ID, Title, Deadline, and submission count per task.
- **Cryptographic Submissions tab**: A detailed table showing each submission with: Student Name, Task Title, Encrypted Filename, and a **"Decrypt & Verify Signature"** action button.

#### D. Create Assignment Task
- Navigate to `/create-task` and fill in:
  - **Task Title** (e.g., "Cryptography Lab Report").
  - **Description** (what students need to submit).
  - **Deadline** (due date).
- Submit the form to create the task, which becomes immediately visible to all students.
- After creation, the teacher can create another task or return to the dashboard.

#### E. Decrypt & Verify Student Submissions
- From the **Cryptographic Submissions** tab, click **"Decrypt & Verify Signature"** on any submission.
- The system executes the following **cryptographic verification pipeline** with a visual log:
  1. **Unwrap** the AES DEK using the teacher's RSA-3072 private key (RSA-OAEP).
  2. **Decrypt** the ciphertext payload with AES-256-GCM.
  3. **Verify** the AES-GCM authentication tag (integrity check).
  4. **Hash** the raw decrypted file to compute a SHA-256 fingerprint.
  5. **Authenticate** the RSA-PSS signature against the student's public key (non-repudiation).
  6. ✅ **Verified** — triggers secure file download.
- If verification fails (tampered document or forged signature), the system displays a **CRITICAL SECURITY ALERT**.
- The verified & decrypted file is downloaded directly to the teacher's machine.

#### F. Manage Profile
- Same profile management capabilities as students (view/edit personal info, reveal sensitive fields).

---

## 3. Admin Role

### 3.1 Description
The **Admin** has a system-wide overview and manages users and monitors the health of all cryptographic operations. The admin can view all tasks and submissions across the platform.

### 3.2 Accessible Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | System-wide statistics and health overview |
| User Management | `/users` | View and manage all users in the system |
| Profile | `/profile` | View and edit personal information |

### 3.3 Tasks & Responsibilities

#### A. Registration
- Admin accounts are typically created through the registration system with the `admin` role.
- Same RSA-3072 key pair generation and encrypted private key storage.

#### B. Login
- Same secure login flow as other roles with KEK derivation and private key decryption.

#### C. System Administration Dashboard
- View a **global overview** of the entire platform:
  - **Total System Tasks** — count of all tasks across all teachers.
  - **Total System Submissions** — count of all submissions across all students.
- Monitor the health of cryptographic operations system-wide.

#### D. User Management
- Access the `/users` page to view and manage registered users.
- The admin has a system-level view with the ability to oversee all platform activity.

#### E. Secure Document Access
- Admins can **download submissions** (same as teachers) as long as they are authorized.
- Backend authorization checks ensure admins can access submissions linked to their role scope.

#### F. Manage Profile
- Same profile management capabilities as other roles.

---

## Role Comparison Matrix

| Capability | Student | Teacher | Admin |
|---|:---:|:---:|:---:|
| Register & generate RSA-3072 keys | ✅ | ✅ | ✅ |
| Login with KEK-based key recovery | ✅ | ✅ | ✅ |
| View personal dashboard | ✅ | ✅ | ✅ |
| Upload encrypted assignments | ✅ | ❌ | ❌ |
| Create assignment tasks | ❌ | ✅ | ✅ |
| View submission list | Own only | All received | All system-wide |
| Decrypt & verify submissions (RSA-OAEP + PSS) | ❌ | ✅ | ✅ |
| Download decrypted files | ❌ | ✅ | ✅ |
| View all tasks system-wide | ❌ | Own only | ✅ |
| View all submissions system-wide | ❌ | Own only | ✅ |
| Manage user accounts | ❌ | ❌ | ✅ |
| Edit profile | ✅ | ✅ | ✅ |

---

## Cryptographic Algorithms by Role

| Algorithm | Student Usage | Teacher Usage |
|---|---|---|
| **AES-256-GCM** | Encrypts the document during upload | Decrypts the document during download |
| **RSA-3072-OAEP** (SHA-256) | Wraps the DEK with the teacher's public key | Unwraps the DEK with their own private key |
| **RSA-PSS** (SHA-256) | Signs the document hash + metadata with their private key | Verifies the signature with the student's public key |
| **PBKDF2 / Argon2id** | Derives KEK from password to protect private key | Derives KEK from password to protect private key |
| **SHA-256** | Hashes the document before signing | Re-hashes to verify integrity after decryption |

---

## Navigation Summary (Sidebar)

### Student Sidebar
1. 📊 Dashboard
2. 📤 Upload Assignment
3. 👤 Profile

### Teacher Sidebar
1. 📊 Dashboard
2. 👥 Students
3. ➕ Create Task
4. 👤 Profile

### Admin Sidebar
1. 📊 Dashboard
2. 👥 User Management
3. 👤 Profile

---

## Authentication & Security (Shared Across All Roles)

1. **Registration**: Every user generates an RSA-3072 key pair. The private key is encrypted with AES-256-GCM using a KEK derived from the user's password (PBKDF2/Argon2id with a 16-byte random salt).
2. **Login**: Password is verified using bcrypt/Argon2id. The KEK is re-derived to decrypt the private key, which is cached in server memory for 120 minutes.
3. **Logout**: The user's API token is revoked, and the cached private key is cleared.
4. **Password Reset**: Available to all users via the `/reset-password` route.
5. **Route Protection**: All dashboard pages are wrapped in `ProtectedRoute` components that enforce role-based access. Unauthorized users are redirected to the login page.
6. **API Authorization**: Backend endpoints check the user's role (via Laravel Sanctum authentication) before allowing access to protected resources.
