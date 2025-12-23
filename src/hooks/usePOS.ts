// =============================================================================
// PRODUCTION-GRADE POS SYSTEM - CUSTOM HOOK
// Manages cart state, payment flow, and receipt printing
// =============================================================================

import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CartItem,
  SaleData,
  PaymentMethod,
  PaymentStatus,
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

interface UsePOSOptions {
  onSaleComplete?: (saleData: SaleData) => void;
}

export function usePOS(options: UsePOSOptions = {}) {
  const { toast } = useToast();
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
        // Sale was created but payment failed - don't clear cart
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

      // Check if fully paid
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
  }, [cartItems, cartTotals, selectedCustomer, appliedCoupon, clearCart, toast, options]);

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

    // Mark receipt as printed
    await markReceiptPrinted(currentSale.sale_id);
    
    // Trigger browser print
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
