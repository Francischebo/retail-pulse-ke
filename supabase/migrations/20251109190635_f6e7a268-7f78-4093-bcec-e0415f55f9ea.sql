-- Fix search_path for existing functions (with proper dependency handling)

-- Temporarily remove default from sale_number
ALTER TABLE public.sales ALTER COLUMN sale_number DROP DEFAULT;

-- Drop and recreate generate_sale_number with search_path
DROP FUNCTION IF EXISTS public.generate_sale_number();
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'SALE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('sale_number_seq')::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- Restore the default
ALTER TABLE public.sales ALTER COLUMN sale_number SET DEFAULT generate_sale_number();

-- Recreate update_updated_at_column with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;