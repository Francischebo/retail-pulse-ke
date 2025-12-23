// =============================================================================
// PRODUCTION-GRADE POS SYSTEM - TYPE DEFINITIONS
// =============================================================================

export type PaymentStatus = 'pending' | 'processing' | 'partially_paid' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'airtel_money';

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleData {
  sale_id?: string;
  sale_number: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  idempotency_key?: string;
  receipt_printed_at?: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  idempotency_key: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  mpesa_phone?: string;
  mpesa_checkout_request_id?: string;
  mpesa_transaction_id?: string;
  payment_reference?: string;
  error_message?: string;
  attempts: number;
  initiated_at: string;
  completed_at?: string;
}

export interface CreateSaleResult {
  success: boolean;
  sale_id?: string;
  sale_number?: string;
  balance_due?: number;
  error?: string;
  message?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  payment_id?: string;
  amount_paid?: number;
  balance_due?: number;
  payment_status?: PaymentStatus;
  is_fully_paid?: boolean;
  error?: string;
  message?: string;
}

// Validation constants for financial calculations
export const TAX_RATE = 0.16; // 16% VAT for Kenya
export const CURRENCY_CODE = 'KES';
export const CURRENCY_SYMBOL = 'KSh';

// Precision for financial calculations (avoid floating-point errors)
export const DECIMAL_PRECISION = 2;

/**
 * Safe decimal calculation to avoid floating-point errors
 * Converts to integer cents for calculation, then back to decimal
 */
export function safeDecimal(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Safe addition of decimal values
 */
export function safeAdd(...values: number[]): number {
  const sum = values.reduce((acc, val) => acc + Math.round(val * 100), 0);
  return sum / 100;
}

/**
 * Safe subtraction of decimal values
 */
export function safeSubtract(a: number, b: number): number {
  return (Math.round(a * 100) - Math.round(b * 100)) / 100;
}

/**
 * Safe multiplication of decimal values
 */
export function safeMultiply(a: number, b: number): number {
  return Math.round(a * b * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${safeDecimal(amount).toFixed(DECIMAL_PRECISION)}`;
}

/**
 * Generate idempotency key for transactions
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
