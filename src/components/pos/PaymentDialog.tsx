import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CartItem, SaleData } from "@/pages/admin/POS";
import { Loader2, CreditCard, Smartphone, Banknote } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onComplete: (saleData: SaleData) => void;
}

const PaymentDialog = ({ open, onOpenChange, cartItems, onComplete }: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mpesa" | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaReference, setMpesaReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "mpesa" && (!mpesaPhone || !mpesaReference)) {
      toast({
        title: "M-PESA details required",
        description: "Please enter phone number and transaction reference",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([{
          cashier_id: user.id,
          subtotal,
          tax,
          discount: 0,
          total,
          payment_method: paymentMethod,
          payment_reference: paymentMethod === "mpesa" ? mpesaReference : undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || mpesaPhone || undefined,
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("sales_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cartItems) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock_quantity: item.stock - item.quantity })
          .eq("id", item.product_id);

        if (stockError) throw stockError;
      }

      toast({
        title: "Sale completed",
        description: `Sale #${sale.sale_number} processed successfully`,
      });

      const saleData: SaleData = {
        sale_number: sale.sale_number,
        items: cartItems,
        subtotal,
        tax,
        discount: 0,
        total,
        payment_method: paymentMethod,
        payment_reference: paymentMethod === "mpesa" ? mpesaReference : undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || mpesaPhone || undefined,
      };

      onComplete(saleData);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod(null);
    setMpesaPhone("");
    setMpesaReference("");
    setCustomerName("");
    setCustomerPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>KSh {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>VAT (16%)</span>
              <span>KSh {tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">KSh {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex flex-col h-20"
              >
                <Banknote className="h-6 w-6 mb-1" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex flex-col h-20"
              >
                <CreditCard className="h-6 w-6 mb-1" />
                <span className="text-xs">Card</span>
              </Button>
              <Button
                variant={paymentMethod === "mpesa" ? "default" : "outline"}
                onClick={() => setPaymentMethod("mpesa")}
                className="flex flex-col h-20"
              >
                <Smartphone className="h-6 w-6 mb-1" />
                <span className="text-xs">M-PESA</span>
              </Button>
            </div>
          </div>

          {paymentMethod === "mpesa" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="mpesa-phone">M-PESA Phone Number</Label>
                <Input
                  id="mpesa-phone"
                  placeholder="0712345678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mpesa-ref">Transaction Reference</Label>
                <Input
                  id="mpesa-ref"
                  placeholder="e.g., ABC123XYZ"
                  value={mpesaReference}
                  onChange={(e) => setMpesaReference(e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label>Customer Details (Optional)</Label>
            <Input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {paymentMethod !== "mpesa" && (
              <Input
                placeholder="Customer Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete Payment`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
