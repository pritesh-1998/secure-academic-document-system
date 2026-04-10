<?php

namespace App\Services;

/**
 * SimHash Service
 *
 * Implements 64-bit SimHash fingerprinting for near-duplicate content detection.
 * Two documents with a Hamming distance <= SIMILARITY_THRESHOLD bits are considered
 * suspiciously similar, even if modified slightly.
 *
 * Algorithm:
 *  1. Tokenize text into words (n-grams of 2)
 *  2. Hash each token with CRC32 (fast, sufficient for fingerprinting)
 *  3. Accumulate weighted bit vectors
 *  4. Collapse vector back to 64-bit fingerprint
 */
class SimHashService
{
    // Max bits different out of 64 to still consider "similar"
    // 10 bits ≈ ~84% similarity threshold
    const SIMILARITY_THRESHOLD = 10;

    /**
     * Compute a 64-bit SimHash fingerprint from a string of text.
     */
    public function compute(string $text): int
    {
        $text = $this->normalize($text);
        $tokens = $this->tokenize($text);

        if (empty($tokens)) {
            return 0;
        }

        // 64-element vector of signed integers
        $vector = array_fill(0, 64, 0);

        foreach ($tokens as $token) {
            // Use CRC32 for speed + spread bits across 32 bits, mirror to 64
            $hash32 = crc32($token);
            // Extend to 64 bits by XOR-ing with shifted self
            $hash = ($hash32 ^ ($hash32 << 32));

            for ($i = 0; $i < 64; $i++) {
                if (($hash >> $i) & 1) {
                    $vector[$i]++;
                } else {
                    $vector[$i]--;
                }
            }
        }

        // Build fingerprint: bit i = 1 if vector[i] > 0
        $fingerprint = 0;
        for ($i = 0; $i < 64; $i++) {
            if ($vector[$i] > 0) {
                $fingerprint |= (1 << $i);
            }
        }

        // Return as unsigned 64-bit (store as PHP int, which is 64-bit signed on 64-bit systems)
        return $fingerprint;
    }

    /**
     * Compute Hamming distance between two SimHash fingerprints.
     * Returns number of differing bits (0 = identical, 64 = completely different).
     */
    public function hammingDistance(int $a, int $b): int
    {
        $xor = $a ^ $b;
        // Count set bits (popcount)
        $count = 0;
        while ($xor !== 0) {
            $count += $xor & 1;
            $xor = ($xor >> 1) & PHP_INT_MAX; // unsigned right shift
        }
        return $count;
    }

    /**
     * Returns true if two fingerprints are suspiciously similar.
     */
    public function isSimilar(int $a, int $b): bool
    {
        return $this->hammingDistance($a, $b) <= self::SIMILARITY_THRESHOLD;
    }

    /**
     * Extract readable plain text from an uploaded file.
     * Supports: .txt, .pdf (basic), .docx (basic XML extraction).
     */
    public function extractText(string $filePath, string $mimeType): string
    {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        try {
            if ($mimeType === 'text/plain' || $ext === 'txt') {
                return file_get_contents($filePath) ?: '';
            }

            if ($mimeType === 'application/pdf' || $ext === 'pdf') {
                return $this->extractPdfText($filePath);
            }

            if (in_array($ext, ['docx', 'odt']) ||
                $mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                return $this->extractDocxText($filePath);
            }

            // Fallback: try reading as text
            $content = @file_get_contents($filePath);
            return $content ? $content : '';

        } catch (\Exception $e) {
            return '';
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function normalize(string $text): string
    {
        // Lowercase, remove punctuation, collapse whitespace
        $text = mb_strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', trim($text));
        return $text;
    }

    private function tokenize(string $text): array
    {
        $words = explode(' ', $text);
        $words = array_filter($words, fn($w) => strlen($w) > 2);
        $words = array_values($words);

        // Build bigrams (pairs of adjacent words) for better sensitivity
        $tokens = $words;
        for ($i = 0; $i < count($words) - 1; $i++) {
            $tokens[] = $words[$i] . '_' . $words[$i + 1];
        }

        return $tokens;
    }

    private function extractPdfText(string $filePath): string
    {
        // Lightweight PDF text extraction: read raw bytes and pull out text streams
        $content = file_get_contents($filePath);
        if (!$content) return '';

        // Extract text between BT (Begin Text) and ET (End Text) markers
        preg_match_all('/BT\s+(.*?)\s+ET/s', $content, $matches);
        $text = '';
        foreach ($matches[1] as $block) {
            // Extract strings in parentheses
            preg_match_all('/\(([^)]*)\)/', $block, $strings);
            foreach ($strings[1] as $s) {
                $text .= ' ' . $s;
            }
        }

        // Also try to get raw text between stream/endstream
        preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $content, $streams);
        foreach ($streams[1] as $stream) {
            if (!mb_check_encoding($stream, 'UTF-8')) continue;
            $text .= ' ' . preg_replace('/[^\x20-\x7E\s]/', ' ', $stream);
        }

        return $text ?: '';
    }

    private function extractDocxText(string $filePath): string
    {
        // DOCX is a ZIP containing word/document.xml
        if (!class_exists('ZipArchive')) return '';

        $zip = new \ZipArchive();
        if ($zip->open($filePath) !== true) return '';

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (!$xml) return '';

        // Strip XML tags and decode entities
        $text = strip_tags($xml);
        return html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
