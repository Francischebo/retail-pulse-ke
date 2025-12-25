// =============================================================================
// PRODUCTION-GRADE POS INTERFACE
// Professional layout following IEEE and retail POS standards
// Responsive design for all screen sizes from mobile to large displays
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Loader2, 
  Calculator, 
  Grid3X3, 
  List,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ProductSearch from "@/components/pos/ProductSearch";
import Cart from "@/components/pos/Cart";
import PaymentDialog from "@/components/pos/PaymentDialog";
import Receipt from "@/components/pos/Receipt";
import { NetworkStatusBar } from "@/components/pos/NetworkStatusBar";
import { usePOS } from "@/hooks/usePOS";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { formatCurrency } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

const POS = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
    isOnline,
  } = usePOS();

  const { 
    isSyncing, 
    pendingCount, 
    triggerSync 
  } = useOfflineSync();

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (showReceipt && currentSale) {
    return <Receipt saleData={currentSale} onNewSale={startNewSale} />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* ===== TOP HEADER BAR ===== */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
          {/* Left Section - Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="gap-1 sm:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-bold">Point of Sale</h1>
            </div>
          </div>

          {/* Center Section - Network Status */}
          <div className="hidden md:flex">
            <NetworkStatusBar
              isOnline={isOnline}
              isSyncing={isSyncing}
              pendingCount={pendingCount}
              onSync={triggerSync}
            />
          </div>

          {/* Right Section - View Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="hidden lg:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Network Status */}
        <div className="md:hidden px-2 pb-2">
          <NetworkStatusBar
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            onSync={triggerSync}
          />
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ===== PRODUCT AREA (Left Side on Desktop) ===== */}
        <div className="flex-1 flex flex-col min-h-0 lg:min-w-0">
          {/* Product Search Header */}
          <div className="bg-card border-b border-border p-3 sm:p-4">
            <ProductSearch onProductSelect={addToCart} />
          </div>

          {/* Quick Action Categories (Optional Enhancement) */}
          <div className="bg-card border-b border-border p-2 sm:p-3 hidden sm:block">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap">
                All Products
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted whitespace-nowrap">
                Groceries
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted whitespace-nowrap">
                Beverages
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted whitespace-nowrap">
                Dairy
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted whitespace-nowrap">
                Snacks
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted whitespace-nowrap">
                Personal Care
              </Badge>
            </div>
          </div>

          {/* Product Results Area */}
          <ScrollArea className="flex-1 p-3 sm:p-4">
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm sm:text-base">Search for products by name, barcode, or SKU</p>
              <p className="text-xs sm:text-sm mt-1">Or scan barcode to quick-add items</p>
            </div>
          </ScrollArea>
        </div>

        {/* ===== CART AREA (Right Side on Desktop / Bottom on Mobile) ===== */}
        <div className={cn(
          "bg-card border-t lg:border-t-0 lg:border-l border-border",
          "w-full lg:w-[380px] xl:w-[420px] 2xl:w-[480px]",
          "flex flex-col",
          // On mobile, show as collapsible or full height based on cart items
          cartItems.length > 0 ? "h-[50vh] lg:h-auto" : "h-auto lg:h-auto"
        )}>
          {/* Cart Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg">Shopping Cart</h2>
              <Badge variant="secondary" className="text-xs">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive text-xs sm:text-sm"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 min-h-0">
            {cartItems.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-muted-foreground">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Calculator className="h-8 w-8 sm:h-10 sm:w-10 opacity-30" />
                </div>
                <p className="font-medium text-sm sm:text-base">Cart is empty</p>
                <p className="text-xs sm:text-sm mt-1">Add products to start a sale</p>
              </div>
            ) : (
              <div className="p-2 sm:p-3 space-y-2">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-2 sm:p-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-6 sm:w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 px-1 text-xs text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart Totals & Checkout */}
          {cartItems.length > 0 && (
            <div className="border-t border-border p-3 sm:p-4 space-y-3 bg-muted/30">
              {/* Totals Summary */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartTotals.subtotal)}</span>
                </div>
                {cartTotals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(cartTotals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (16%)</span>
                  <span>{formatCurrency(cartTotals.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(cartTotals.total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(cartTotals.total)}
                  </>
                )}
              </Button>

              {/* Offline Notice */}
              {!isOnline && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  Offline mode - Cash payments only
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== PAYMENT DIALOG ===== */}
      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        cartItems={cartItems}
        customerId={selectedCustomer?.id}
        customerName={selectedCustomer?.full_name}
        discount={cartTotals.discount}
        onComplete={() => {}}
      />
    </div>
  );
};

export default POS;
