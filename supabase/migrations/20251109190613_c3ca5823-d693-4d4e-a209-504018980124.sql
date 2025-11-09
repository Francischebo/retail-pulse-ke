-- Add default value for sale_number column
ALTER TABLE public.sales
ALTER COLUMN sale_number SET DEFAULT generate_sale_number();