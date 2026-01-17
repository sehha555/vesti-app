// apps/web/lib/security/file-signature.ts
// File signature (magic bytes) verification

/**
 * Known file signatures (magic bytes)
 * Used to verify file content matches declared MIME type
 */
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [
    Buffer.from([0xff, 0xd8, 0xff]), // JPEG: FF D8 FF
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG: 89 50 4E 47 0D 0A 1A 0A
  ],
  'image/webp': [
    // WebP: RIFF....WEBP (at offset 0 and 8)
    Buffer.from('RIFF'),
    Buffer.from('WEBP'),
  ],
};

/**
 * Verify file signature (magic bytes) matches declared MIME type
 * @param buffer - File buffer
 * @param mimeType - Declared MIME type (e.g., 'image/jpeg')
 * @returns { valid: boolean, reason?: string }
 */
export function verifyFileSignature(
  buffer: Buffer,
  mimeType: string,
): {
  valid: boolean;
  reason?: string;
} {
  const signatures = FILE_SIGNATURES[mimeType];

  if (!signatures) {
    return {
      valid: false,
      reason: `Unsupported MIME type for signature verification: ${mimeType}`,
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      reason: 'File is empty',
    };
  }

  // Special handling for WebP (needs check at offset 0 and 8)
  if (mimeType === 'image/webp') {
    const riffSignature = signatures[0];
    const webpSignature = signatures[1];

    if (buffer.length < 12) {
      return {
        valid: false,
        reason: 'File too small for WebP signature',
      };
    }

    const hasRiff = buffer.subarray(0, 4).equals(riffSignature);
    const hasWebp = buffer.subarray(8, 12).equals(webpSignature);

    if (!hasRiff || !hasWebp) {
      return {
        valid: false,
        reason: 'Invalid WebP signature',
      };
    }

    return { valid: true };
  }

  // Standard signature check (at beginning of file)
  const signature = signatures[0];
  const hasSignature = buffer.subarray(0, signature.length).equals(signature);

  if (!hasSignature) {
    return {
      valid: false,
      reason: `Invalid file signature for ${mimeType}`,
    };
  }

  return { valid: true };
}

/**
 * Map MIME types to human-readable format names for error messages
 */
const MIME_TYPE_NAMES: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

/**
 * Get human-readable format name
 */
export function getFormatName(mimeType: string): string {
  return MIME_TYPE_NAMES[mimeType] || mimeType;
}
