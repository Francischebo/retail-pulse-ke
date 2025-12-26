// =============================================================================
// SECURITY UTILITIES - INPUT VALIDATION & SANITIZATION
// Production-grade security for all user inputs
// =============================================================================

import { z } from "zod";

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes search input
 */
export function sanitizeSearchInput(input: string, maxLength: number = 100): string {
  if (!input) return '';
  // Remove potentially dangerous characters while keeping search-friendly ones
  return input
    .slice(0, maxLength)
    .replace(/[<>'";&]/g, '')
    .trim();
}

/**
 * Validates phone number format (Kenya format)
 */
export const phoneSchema = z.string()
  .regex(/^(\+254|0)?[17][0-9]{8}$/, "Invalid phone number format")
  .optional()
  .or(z.literal(''));

/**
 * Validates email format
 */
export const emailSchema = z.string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .optional()
  .or(z.literal(''));

/**
 * Validates name format
 */
export const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

/**
 * Validates monetary amounts
 */
export const amountSchema = z.number()
  .positive("Amount must be positive")
  .max(999999999, "Amount too large")
  .multipleOf(0.01, "Amount must have at most 2 decimal places");

/**
 * Validates quantity
 */
export const quantitySchema = z.number()
  .int("Quantity must be a whole number")
  .nonnegative("Quantity cannot be negative")
  .max(999999, "Quantity too large");

/**
 * Validates text fields (generic)
 */
export const textSchema = (maxLength: number = 1000) => z.string()
  .max(maxLength, `Text too long (max ${maxLength} characters)`)
  .transform(val => sanitizeHtml(val));

/**
 * Validates SKU/barcode format
 */
export const skuSchema = z.string()
  .max(50, "SKU too long")
  .regex(/^[a-zA-Z0-9-_]+$/, "SKU contains invalid characters")
  .optional()
  .or(z.literal(''));

/**
 * Rate limiting tracker (client-side)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Validates and sanitizes form data
 */
export function validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}

/**
 * Checks for SQL injection patterns (additional layer of defense)
 */
export function hasSqlInjectionPattern(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(OR|AND)\s+\d+\s*=\s*\d+/i,
    /'\s*(OR|AND)\s+'[^']*'\s*='\s*[^']*'/i,
  ];
  
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Generates a secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy headers helper
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
