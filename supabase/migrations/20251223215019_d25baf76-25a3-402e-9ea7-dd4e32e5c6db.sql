-- =============================================================================
-- PRODUCTION-GRADE POS SYSTEM - DATABASE HARDENING (Part 1: Enums & Tables)
-- =============================================================================

-- 1. Payment status enum for state machine
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'partially_paid', 'paid', 'failed', 'refunded', 'cancelled');

-- 2. Audit action enum
CREATE TYPE public.audit_action AS ENUM (
  'sale_created', 'sale_updated', 'payment_initiated', 'payment_completed', 
  'payment_failed', 'refund_initiated', 'refund_completed', 'stock_adjusted',
  'product_created', 'product_updated', 'user_login', 'user_logout'
);

-- 3. Create audit_logs table (append-only, immutable financial records)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view audit logs, nobody can modify
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 4. Create payments table for tracking payment state machine
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  idempotency_key UUID NOT NULL UNIQUE,
  payment_method payment_method NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  status payment_status NOT NULL DEFAULT 'pending',
  mpesa_phone TEXT,
  mpesa_checkout_request_id TEXT,
  mpesa_merchant_request_id TEXT,
  mpesa_transaction_id TEXT,
  payment_reference TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);
CREATE INDEX idx_payments_mpesa_checkout ON payments(mpesa_checkout_request_id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS for payments
CREATE POLICY "Authenticated users can view payments" ON public.payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Cashiers can create payments" ON public.payments
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'cashier')
  );

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'cashier')
  );

-- 5. Add payment_status and balance tracking to sales table
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS receipt_printed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id UUID;

-- 6. Add foreign key constraint for payments to sales
ALTER TABLE public.payments
  ADD CONSTRAINT payments_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT;

-- 7. Create trigger for updated_at on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to log audit events (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action audit_action,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, old_data, new_data, metadata)
  VALUES (p_action, p_entity_type, p_entity_id, auth.uid(), p_old_data, p_new_data, p_metadata)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 9. Create function to verify receipt can be printed
CREATE OR REPLACE FUNCTION public.can_print_receipt(p_sale_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status payment_status;
BEGIN
  SELECT payment_status INTO v_status
  FROM sales WHERE id = p_sale_id;
  
  -- Only allow receipt printing for fully paid sales
  RETURN v_status = 'paid';
END;
$$;

-- 10. Create function to mark receipt as printed
CREATE OR REPLACE FUNCTION public.mark_receipt_printed(p_sale_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sales
  SET receipt_printed_at = now()
  WHERE id = p_sale_id
    AND payment_status = 'paid'
    AND receipt_printed_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- 11. Prevent deletion of financial records
CREATE OR REPLACE FUNCTION public.prevent_financial_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Deletion of financial records is not allowed. Use status updates for corrections.';
  RETURN NULL;
END;
$$;

CREATE TRIGGER prevent_sales_delete
  BEFORE DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION prevent_financial_delete();

CREATE TRIGGER prevent_sales_items_delete
  BEFORE DELETE ON sales_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_financial_delete();

CREATE TRIGGER prevent_payments_delete
  BEFORE DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_financial_delete();