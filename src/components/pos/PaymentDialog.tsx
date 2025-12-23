import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/lib/pos/types";
import { createSaleAtomic, processPayment, validateMpesaPhone, calculateCartTotals } from "@/lib/pos/payment-service";
import { formatCurrency, generateIdempotencyKey, PaymentMethod, SaleData } from "@/lib/pos/types";
import { Loader2, CreditCard, Smartphone, Banknote, Shield, AlertTriangle } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  discount?: number;
  customerId?: string;
  customerName?: string;
  onComplete: (saleData: SaleData) => void;
}

const PaymentDialog = ({ open, onOpenChange, cartItems, discount = 0, customerId, customerName: initialCustomerName, onComplete }: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaReference, setMpesaReference] = useState("");
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Calculate totals with safe decimal arithmetic
  const totals = calculateCartTotals(cartItems, discount);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Select payment method",
        variant: "destructive",
      });
      return;
    }

    // Validate M-Pesa details
    let formattedMpesaPhone: string | undefined;
    if (paymentMethod === "mpesa") {
      if (!mpesaPhone) {
        toast({
          title: "M-PESA phone required",
          description: "Please enter phone number for STK push",
          variant: "destructive",
        });
        return;
      }
      
      const validation = validateMpesaPhone(mpesaPhone);
      if (!validation.valid) {
        toast({
          title: "Invalid phone number",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      formattedMpesaPhone = validation.formatted;
    }

    setIsProcessing(true);
    const idempotencyKey = generateIdempotencyKey();

    try {
      // Step 1: Create sale atomically
      const saleResult = await createSaleAtomic({
        items: cartItems,
        paymentMethod,
        customerId,
        customerName: customerName || undefined,
        customerPhone: customerPhone || formattedMpesaPhone || undefined,
        discount,
        idempotencyKey,
      });

      if (!saleResult.success) {
        toast({
          title: "Sale Failed",
          description: saleResult.error || "Could not create sale",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Process payment
      const paymentResult = await processPayment({
        saleId: saleResult.sale_id!,
        paymentMethod,
        amount: totals.total,
        mpesaPhone: formattedMpesaPhone,
        paymentReference: mpesaReference || undefined,
      });

      if (!paymentResult.success) {
        toast({
          title: "Payment Failed",
          description: paymentResult.error || "Could not process payment",
          variant: "destructive",
        });
        return;
      }

      // Build complete sale data
      const saleData: SaleData = {
        sale_id: saleResult.sale_id,
        sale_number: saleResult.sale_number!,
        items: cartItems,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        amount_paid: paymentResult.amount_paid || totals.total,
        balance_due: paymentResult.balance_due || 0,
        payment_status: paymentResult.payment_status || 'paid',
        payment_method: paymentMethod,
        payment_reference: mpesaReference || undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || formattedMpesaPhone || undefined,
        customer_id: customerId,
        idempotency_key: idempotencyKey,
      };

      if (paymentResult.is_fully_paid) {
        toast({
          title: "Payment Successful",
          description: `Sale #${saleResult.sale_number} completed`,
        });
        onComplete(saleData);
        resetForm();
      } else {
        toast({
          title: "Partial Payment",
          description: `Balance due: ${formatCurrency(paymentResult.balance_due || 0)}`,
        });
      }
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
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between mb-2 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between mb-2 text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2 text-sm">
              <span>VAT (16%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
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

          {/* M-Pesa Details */}
          {paymentMethod === "mpesa" && (
            <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                M-PESA Payment
              </Badge>
              <div>
                <Label htmlFor="mpesa-phone">Phone Number *</Label>
                <Input
                  id="mpesa-phone"
                  placeholder="0712345678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  STK push will be sent to this number
                </p>
              </div>
              <div>
                <Label htmlFor="mpesa-ref">Transaction Reference (Optional)</Label>
                <Input
                  id="mpesa-ref"
                  placeholder="e.g., ABC123XYZ"
                  value={mpesaReference}
                  onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Customer Details */}
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

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              All transactions are encrypted and recorded for audit purposes. 
              Receipt will only print after payment is confirmed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
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
              disabled={isProcessing || !paymentMethod}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(totals.total)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;