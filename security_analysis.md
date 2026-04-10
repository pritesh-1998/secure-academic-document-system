# Security Analysis & Competitive Evaluation
## Secure Academic Document System vs. Google Classroom
### INSE 6110 — Applied Cryptography Project

 Google Classroom — Security Architecture

Google Classroom is a **collaboration and workflow platform**, not a secure cryptographic document system. Here is what Google Classroom does NOT provide:

| Security Property | Google Classroom | Our System |
|---|---|---|
| End-to-end encryption of documents | ❌ Google can read all files | ✅ AES-256-GCM, only teacher can decrypt |
| Digital signatures on submissions | ❌ No cryptographic authorship proof | ✅ RSA-3072-PSS per submission |
| Non-repudiation | ❌ No proof student actually submitted | ✅ Mathematically bound signature |
| Key-at-rest protection | ❌ Google manages all keys | ✅ Student's private key never stored in plaintext |
| Submission integrity verification | ❌ Trust-based, no cryptographic check | ✅ SHA-256 + GCM tag verification on download |
| Duplicate/similarity detection | ❌ Manual or third-party (Turnitin) | ✅ Built-in SimHash + SHA-256 |
| Student removal of unverified work | ❌ Not available | ✅ Student can retract before verification |
| Transparency of cryptographic operations | ❌ Black box | ✅ Step-by-step visualization in UI |

---

## Part 3: Why Our System Is Cryptographically Superior

### Scenario 1: Government Subpoena / Data Request
**Google Classroom:** Google complies with lawful government requests and can hand over student documents because Google stores the encryption keys. All student work is accessible to Google and any entity with a valid court order.

**Our System:** Since the DEK is wrapped with the **teacher's RSA public key**, even a database administrator cannot decrypt a submission. A court order to the server provider yields only AES-encrypted ciphertext — useless without the teacher's private key, which itself is AES-encrypted with a KEK derived from the password.

---

### Scenario 2: The Disputed Submission
**Student:** "I never submitted that assignment."  
**Teacher:** "Yes you did."

**Google Classroom:** This is a he-said/she-said situation. Google's audit logs exist but are proprietary and not cryptographically binding — Google could theoretically modify them.

**Our System:** The RSA-PSS digital signature is **mathematically undeniable**. The signature was created using the **student's private key** (which only they could access at login time). The teacher can prove — to anyone — that this specific student signed this specific document at this specific timestamp. This is **non-repudiation** — a core legal concept in digital evidence.

---

### Scenario 3: The Malicious Teacher
**Threat:** A corrupt teacher modifies a student's submitted document after receiving it (e.g., to give unfair marks).

**Google Classroom:** The teacher can download, modify, and re-upload the document. No detection mechanism exists.

**Our System:**
1. The SHA-256 hash of the original file is stored at submission time
2. On download, the decrypted plaintext is re-hashed and compared
3. Any modification to the ciphertext on disk breaks the **AES-GCM authentication tag** (Integrity Check #1)
4. Even if the tag somehow passed, the SHA-256 hash comparison would fail (Integrity Check #2)
5. Even if that passed, the RSA-PSS signature over the original content would invalidate (Integrity Check #3)

**Three independent cryptographic layers** protect against post-submission tampering.

---

### Scenario 4: The Database Breach
**Threat:** An attacker exfiltrates the entire database.

**Google Classroom:** All assignment content, feedback, and student data is immediately readable (Google encrypts at-rest by their own keys, but the attacker gains access as Google's "identity").

**Our System:** The attacker gets:
- Bcrypt password hashes (100,000-round PBKDF2 to crack each private key)
- AES-256-GCM encrypted private keys (computationally infeasible to brute-force)
- AES-256-GCM encrypted file ciphertexts (no DEK without private key)
- RSA-OAEP wrapped DEKs (useless without teacher's private key)

Even with the full database, **zero documents can be read** without:
1. Breaking AES-256-GCM (no known attack)
2. Breaking RSA-3072-OAEP (no known attack)
3. Cracking the PBKDF2-derived KEK (requires password + 100K iteration hash crack)

---

### Scenario 5: The Compromised Student Account
**Threat:** Attacker steals a student's login credentials.

**Google Classroom:** Attacker immediately gains full access to all submitted and unsubmitted work, can impersonate the student for future submissions, and Google has no mechanism to alert the teacher.

**Our System:**
- The attacker can log in and view their submitted work
- However, to **forge a new submission**, they would need to sign it with the student's private key
- The private key is re-derived on each login from the **plaintext password + PBKDF2 + stored salt**
- Without the original password, the stored AES-GCM encrypted blob cannot be decrypted
- If the student changes their password, the attacker cannot re-derive the KEK
- The teacher's `Verified by Teacher` status locks submissions from deletion, preserving audit trail

---

## Summary: Design Philosophy Comparison

| Dimension | Google Classroom | Our System |
|---|---|---|
| **Trust Model** | Trust Google as intermediary | Zero-trust — cryptographic proof required |
| **Encryption Scope** | At-rest (Google-managed keys) | End-to-end (user-derived keys) |
| **Authorship Proof** | Social (login history) | Mathematical (RSA-PSS digital signature) |
| **Integrity Guarantee** | Administrative (policy) | Cryptographic (GCM tag + SHA-256) |
| **Key Management** | Google manages all keys | User derives keys from password |
| **Regulatory Fit** | FERPA compliant (US-based) | FERPA + stronger (cryptographic non-repudiation) |
| **Transparency** | Closed source / black box | Open audit trail with step-by-step visualization |
| **Academic Integrity** | Turnitin integration (paid) | Built-in SimHash + exact SHA-256 detection |

> **Conclusion:** Google Classroom is an excellent **collaboration tool** optimized for usability. Our system is a
> **cryptographic evidence system** optimized for verifiable, tamper-proof document handling. They solve
> fundamentally different problems — but in the domain of secure, legally defensible academic document submission,
> our system provides properties that Google Classroom **cannot offer by design**.
