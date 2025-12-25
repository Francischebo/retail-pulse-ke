// =============================================================================
// PRODUCTION-GRADE POS SYSTEM - CUSTOM HOOK WITH OFFLINE SUPPORT
// Manages cart state, payment flow, receipt printing, and offline operations
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  CartItem,
  SaleData,
  PaymentMethod,
  generateIdempotencyKey,
  safeDecimal,
  formatCurrency,
} from "@/lib/pos/types";
import {
  createSaleAtomic,
  processPayment,
  canPrintReceipt,
  markReceiptPrinted,
  calculateCartTotals,
  validateMpesaPhone,
} from "@/lib/pos/payment-service";
import { usePromotions } from "@/hooks/usePromotions";
import { offlineStorage, PendingSale } from "@/lib/offline/storage";
import { supabase } from "@/integrations/supabase/client";

interface UsePOSOptions {
  onSaleComplete?: (saleData: SaleData) => void;
}

export function usePOS(options: UsePOSOptions = {}) {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { applyPromotion, validateCoupon } = usePromotions();
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSale, setCurrentSale] = useState<SaleData | null>(null);
  
  // UI state
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Products cache for offline mode
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);

  // Initialize offline storage and load cached products
  useEffect(() => {
    const init = async () => {
      await offlineStorage.init();
      const cached = await offlineStorage.getCachedProducts();
      setCachedProducts(cached);
    };
    init();
  }, []);

  // Cache products when online
  useEffect(() => {
    if (isOnline) {
      const cacheProducts = async () => {
        try {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .gt("stock_quantity", 0);
          
          if (data && data.length > 0) {
            await offlineStorage.cacheProducts(data);
            setCachedProducts(data);
          }
        } catch (error) {
          console.error("Failed to cache products:", error);
        }
      };
      cacheProducts();
    }
  }, [isOnline]);

  // Calculate totals with memoization
  const cartTotals = useMemo(() => {
    const baseTotals = calculateCartTotals(cartItems, 0);
    const { discount } = applyPromotion(baseTotals.subtotal, cartItems, appliedCoupon || undefined);
    return calculateCartTotals(cartItems, discount);
  }, [cartItems, appliedCoupon, applyPromotion]);

  // Add product to cart
  const addToCart = useCallback((product: any) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock_quantity} units available`,
          variant: "destructive",
        });
        return;
      }
      
      setCartItems(prev => prev.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems(prev => [...prev, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price: safeDecimal(parseFloat(product.price)),
        quantity: 1,
        stock: product.stock_quantity,
      }]);
    }

    toast({
      title: "Added to cart",
      description: product.name,
    });
  }, [cartItems, toast]);

  // Update item quantity
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
      return;
    }

    const item = cartItems.find(item => item.id === id);
    if (item && quantity > item.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  }, [cartItems, toast]);

  // Remove item from cart
  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setAppliedCoupon(null);
    setPaymentMethod(null);
  }, []);

  // Apply coupon code
  const applyCoupon = useCallback(async (code: string) => {
    const coupon = await validateCoupon(code.trim().toUpperCase());
    if (coupon) {
      setAppliedCoupon(code.trim().toUpperCase());
      toast({
        title: "Coupon Applied",
        description: `${coupon.name} - ${coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}%` 
          : formatCurrency(coupon.discount_value)} off`,
      });
      return true;
    } else {
      toast({
        title: "Invalid Coupon",
        description: "This coupon is invalid or has expired",
        variant: "destructive",
      });
      return false;
    }
  }, [validateCoupon, toast]);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Start checkout process
  const startCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products to cart before checkout",
        variant: "destructive",
      });
      return false;
    }
    setShowPayment(true);
    return true;
  }, [cartItems, toast]);

  // Save sale for offline sync
  const saveOfflineSale = useCallback(async (params: {
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
  }): Promise<SaleData | null> => {
    const idempotencyKey = generateIdempotencyKey();
    const saleNumber = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const pendingSale: PendingSale = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      items: cartItems,
      payment_method: params.paymentMethod,
      customer_id: selectedCustomer?.id,
      customer_name: params.customerName || selectedCustomer?.full_name,
      customer_phone: params.customerPhone || selectedCustomer?.phone,
      coupon_code: appliedCoupon || undefined,
      discount: cartTotals.discount,
      subtotal: cartTotals.subtotal,
      tax: cartTotals.tax,
      total: cartTotals.total,
      idempotency_key: idempotencyKey,
      synced: false,
      sync_attempts: 0,
    };

    const saved = await offlineStorage.savePendingSale(pendingSale);

    if (saved) {
      // Update local stock cache
      for (const item of cartItems) {
        const product = cachedProducts.find(p => p.id === item.product_id);
        if (product) {
          await offlineStorage.updateCachedProductStock(
            item.product_id,
            product.stock_quantity - item.quantity
          );
        }
      }

      const saleData: SaleData = {
        sale_id: pendingSale.id,
        sale_number: saleNumber,
        items: cartItems,
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        discount: cartTotals.discount,
        total: cartTotals.total,
        amount_paid: cartTotals.total,
        balance_due: 0,
        payment_status: 'paid',
        payment_method: params.paymentMethod,
        customer_name: params.customerName || selectedCustomer?.full_name,
        customer_phone: params.customerPhone || selectedCustomer?.phone,
        customer_id: selectedCustomer?.id,
        idempotency_key: idempotencyKey,
        is_offline: true,
      };

      toast({
        title: "Sale Saved Offline",
        description: "Sale will sync when connection is restored",
      });

      setCurrentSale(saleData);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();

      return saleData;
    }

    toast({
      title: "Error",
      description: "Failed to save offline sale",
      variant: "destructive",
    });

    return null;
  }, [cartItems, cartTotals, selectedCustomer, appliedCoupon, cachedProducts, clearCart, toast]);

  // Process complete sale with payment
  const completeSale = useCallback(async (params: {
    paymentMethod: PaymentMethod;
    mpesaPhone?: string;
    mpesaReference?: string;
    customerName?: string;
    customerPhone?: string;
    amountTendered?: number;
  }) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        variant: "destructive",
      });
      return null;
    }

    if (!params.paymentMethod) {
      toast({
        title: "Select payment method",
        variant: "destructive",
      });
      return null;
    }

    // Handle offline mode - only cash payments allowed offline
    if (!isOnline) {
      if (params.paymentMethod !== 'cash') {
        toast({
          title: "Offline Mode",
          description: "Only cash payments are available offline",
          variant: "destructive",
        });
        return null;
      }
      return saveOfflineSale(params);
    }

    // Validate M-Pesa phone if applicable
    let formattedMpesaPhone: string | undefined;
    if (params.paymentMethod === 'mpesa' && params.mpesaPhone) {
      const validation = validateMpesaPhone(params.mpesaPhone);
      if (!validation.valid) {
        toast({
          title: "Invalid M-Pesa Phone",
          description: validation.error,
          variant: "destructive",
        });
        return null;
      }
      formattedMpesaPhone = validation.formatted;
    }

    setIsProcessing(true);
    const idempotencyKey = generateIdempotencyKey();

    try {
      // Step 1: Create sale with atomic transaction
      const saleResult = await createSaleAtomic({
        items: cartItems,
        paymentMethod: params.paymentMethod,
        customerId: selectedCustomer?.id,
        customerName: params.customerName || selectedCustomer?.full_name,
        customerPhone: params.customerPhone || formattedMpesaPhone || selectedCustomer?.phone,
        couponCode: appliedCoupon || undefined,
        discount: cartTotals.discount,
        idempotencyKey,
      });

      if (!saleResult.success) {
        toast({
          title: "Sale Failed",
          description: saleResult.error || "Could not create sale",
          variant: "destructive",
        });
        return null;
      }

      // Step 2: Process payment
      const paymentResult = await processPayment({
        saleId: saleResult.sale_id!,
        paymentMethod: params.paymentMethod,
        amount: cartTotals.total,
        mpesaPhone: formattedMpesaPhone,
        paymentReference: params.mpesaReference,
      });

      if (!paymentResult.success) {
        toast({
          title: "Payment Failed",
          description: paymentResult.error || "Could not process payment",
          variant: "destructive",
        });
        return null;
      }

      // Build sale data for receipt
      const saleData: SaleData = {
        sale_id: saleResult.sale_id,
        sale_number: saleResult.sale_number!,
        items: cartItems,
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        discount: cartTotals.discount,
        total: cartTotals.total,
        amount_paid: paymentResult.amount_paid || cartTotals.total,
        balance_due: paymentResult.balance_due || 0,
        payment_status: paymentResult.payment_status || 'paid',
        payment_method: params.paymentMethod,
        payment_reference: params.mpesaReference,
        customer_name: params.customerName || selectedCustomer?.full_name,
        customer_phone: params.customerPhone || formattedMpesaPhone || selectedCustomer?.phone,
        customer_id: selectedCustomer?.id,
        idempotency_key: idempotencyKey,
      };

      if (paymentResult.is_fully_paid) {
        toast({
          title: "Payment Successful",
          description: `Sale #${saleResult.sale_number} completed`,
        });
        
        setCurrentSale(saleData);
        setShowPayment(false);
        setShowReceipt(true);
        clearCart();
        
        options.onSaleComplete?.(saleData);
      } else {
        toast({
          title: "Partial Payment",
          description: `Balance due: ${formatCurrency(paymentResult.balance_due || 0)}`,
          variant: "destructive",
        });
      }

      return saleData;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [cartItems, cartTotals, selectedCustomer, appliedCoupon, isOnline, saveOfflineSale, clearCart, toast, options]);

  // Print receipt (only if fully paid)
  const printReceipt = useCallback(async () => {
    if (!currentSale?.sale_id) {
      toast({
        title: "No Sale",
        description: "No sale to print receipt for",
        variant: "destructive",
      });
      return false;
    }

    // For offline sales, allow printing directly
    if (currentSale.is_offline) {
      window.print();
      return true;
    }

    // Verify payment is complete before printing
    const canPrint = await canPrintReceipt(currentSale.sale_id);
    if (!canPrint) {
      toast({
        title: "Cannot Print Receipt",
        description: "Payment must be fully completed before printing receipt",
        variant: "destructive",
      });
      return false;
    }

    await markReceiptPrinted(currentSale.sale_id);
    window.print();
    return true;
  }, [currentSale, toast]);

  // Start new sale
  const startNewSale = useCallback(() => {
    setShowReceipt(false);
    setCurrentSale(null);
    clearCart();
  }, [clearCart]);

  // Cancel payment dialog
  const cancelPayment = useCallback(() => {
    setShowPayment(false);
    setPaymentMethod(null);
  }, []);

  return {
    // Cart state
    cartItems,
    cartTotals,
    selectedCustomer,
    appliedCoupon,
    cachedProducts,
    
    // Cart actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    applyCoupon,
    removeCoupon,
    
    // Payment state
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    
    // Sale state
    currentSale,
    
    // UI state
    showPayment,
    showReceipt,
    
    // Network state
    isOnline,
    
    // Actions
    startCheckout,
    completeSale,
    printReceipt,
    startNewSale,
    cancelPayment,
    setShowPayment,
    setShowReceipt,
  };
}
