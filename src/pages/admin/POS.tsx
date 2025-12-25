import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProductSearch from "@/components/pos/ProductSearch";
import Cart from "@/components/pos/Cart";
import PaymentDialog from "@/components/pos/PaymentDialog";
import Receipt from "@/components/pos/Receipt";
import { usePOS } from "@/hooks/usePOS";
import { useState } from "react";

const POS = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    cartItems,
    cartTotals,
    selectedCustomer,
    appliedCoupon,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    applyCoupon,
    removeCoupon,
    isProcessing,
    currentSale,
    showPayment,
    showReceipt,
    setShowPayment,
    startNewSale,
  } = usePOS();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setIsLoading(false);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    // The usePOS hook handles this internally
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showReceipt && currentSale) {
    return <Receipt saleData={currentSale} onNewSale={startNewSale} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Point of Sale</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <ProductSearch onProductSelect={addToCart} />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onCheckout={handleCheckout}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              discount={cartTotals.discount}
            />
          </div>
        </div>
      </div>

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        cartItems={cartItems}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.full_name}
        discount={cartTotals.discount}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default POS;
