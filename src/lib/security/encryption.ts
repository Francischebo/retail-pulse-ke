// =============================================================================
// SECURITY UTILITIES - ENCRYPTION & HASHING
// Production-grade encryption for sensitive data
// =============================================================================

/**
 * Generates a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a string using SHA-256 (for non-reversible hashing)
 */
export async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates TOTP secret for MFA
 */
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % 32]).join('');
}

/**
 * Generates HOTP value (used in TOTP)
 */
async function generateHOTP(secret: string, counter: number): Promise<string> {
  // Base32 decode the secret
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const secretBytes: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of secret.toUpperCase()) {
    const idx = base32Chars.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      secretBytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  // Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  
  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secretBytes),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  // Generate HMAC
  const hmac = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmacArray = new Uint8Array(hmac);
  
  // Dynamic truncation
  const offset = hmacArray[hmacArray.length - 1] & 0x0f;
  const code = (
    ((hmacArray[offset] & 0x7f) << 24) |
    ((hmacArray[offset + 1] & 0xff) << 16) |
    ((hmacArray[offset + 2] & 0xff) << 8) |
    (hmacArray[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Generates current TOTP code
 */
export async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return generateHOTP(secret, counter);
}

/**
 * Verifies a TOTP code (allows 1 step window for clock drift)
 */
export async function verifyTOTP(secret: string, code: string, timeStep: number = 30): Promise<boolean> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current, previous, and next time step
  for (let i = -1; i <= 1; i++) {
    const expectedCode = await generateHOTP(secret, counter + i);
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generates TOTP URI for QR code generation
 */
export function generateTOTPUri(secret: string, email: string, issuer: string = 'MolabsPOS'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates input length and content
 */
export function validateSecureInput(input: string, maxLength: number = 1000): { valid: boolean; error?: string } {
  if (input.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength} characters` };
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i;
  if (sqlPatterns.test(input)) {
    return { valid: false, error: 'Invalid characters detected' };
  }
  
  return { valid: true };
}

/**
 * Device fingerprint for session binding
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  
  // Simple hash for fingerprint
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
