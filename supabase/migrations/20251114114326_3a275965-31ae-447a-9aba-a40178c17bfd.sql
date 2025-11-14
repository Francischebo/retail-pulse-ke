-- Create promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'bulk_pricing')),
  discount_value NUMERIC NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  min_purchase_amount NUMERIC DEFAULT 0,
  coupon_code TEXT UNIQUE,
  applicable_to TEXT NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'category', 'product')),
  applicable_ids UUID[],
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view active promotions"
  ON public.promotions FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins and managers can manage promotions"
  ON public.promotions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add discount tracking to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_promotions_active ON public.promotions(is_active) WHERE is_active = true;
CREATE INDEX idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX idx_promotions_coupon ON public.promotions(coupon_code) WHERE coupon_code IS NOT NULL;