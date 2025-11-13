import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductSearch from "@/components/pos/ProductSearch";
import Cart from "@/components/pos/Cart";
import PaymentDialog from "@/components/pos/PaymentDialog";
import Receipt from "@/components/pos/Receipt";

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface SaleData {
  sale_number: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_reference?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
}

const POS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleData | null>(null);

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

  const addToCart = (product: any) => {
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
      
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        stock: product.stock_quantity,
      }]);
    }

    toast({
      title: "Added to cart",
      description: product.name,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
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

    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleCheckout = (customerId?: string) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products to cart before checkout",
        variant: "destructive",
      });
      return;
    }
    // Store customer ID for the payment dialog
    setCompletedSale(prev => ({ ...prev, customer_id: customerId } as any));
    setShowPayment(true);
  };

  const handlePaymentComplete = (saleData: SaleData) => {
    setCompletedSale(saleData);
    setShowPayment(false);
    setShowReceipt(true);
    clearCart();
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showReceipt && completedSale) {
    return <Receipt saleData={completedSale} onNewSale={handleNewSale} />;
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
            />
          </div>
        </div>
      </div>

        <PaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          cartItems={cartItems}
          customerId={completedSale?.customer_id}
          onComplete={handlePaymentComplete}
        />
    </div>
  );
};

export default POS;
