import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_quantity: number;
  min_purchase_amount: number;
  coupon_code: string | null;
  applicable_to: string;
  applicable_ids: string[] | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (data) {
      setPromotions(data);
    }
  };

  const applyPromotion = (
    subtotal: number,
    items: any[],
    couponCode?: string
  ) => {
    let bestDiscount = 0;
    let appliedPromotion: Promotion | null = null;

    for (const promo of promotions) {
      // Check if max uses reached
      if (promo.max_uses && promo.current_uses >= promo.max_uses) continue;

      // Check coupon code if provided
      if (couponCode && promo.coupon_code !== couponCode) continue;
      if (!couponCode && promo.coupon_code) continue;

      // Check minimum quantity
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < promo.min_quantity) continue;

      // Check minimum purchase amount
      if (subtotal < promo.min_purchase_amount) continue;

      // Check applicable items
      let applicableSubtotal = subtotal;
      if (promo.applicable_to === "product" && promo.applicable_ids) {
        applicableSubtotal = items
          .filter((item) => promo.applicable_ids?.includes(item.product_id))
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
      } else if (promo.applicable_to === "category" && promo.applicable_ids) {
        // Would need category info in items to filter
        applicableSubtotal = subtotal;
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === "percentage") {
        discount = applicableSubtotal * (promo.discount_value / 100);
      } else if (promo.discount_type === "fixed") {
        discount = promo.discount_value;
      } else if (promo.discount_type === "bulk_pricing") {
        if (totalQuantity >= promo.min_quantity) {
          discount = promo.discount_value;
        }
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        appliedPromotion = promo;
      }
    }

    return {
      discount: bestDiscount,
      promotion: appliedPromotion,
    };
  };

  const validateCoupon = async (code: string): Promise<Promotion | null> => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("coupon_code", code)
      .eq("is_active", true)
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .single();

    if (data && (!data.max_uses || data.current_uses < data.max_uses)) {
      return data;
    }
    return null;
  };

  return { promotions, applyPromotion, validateCoupon };
};
