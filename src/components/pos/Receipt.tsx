import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaleData } from "@/pages/admin/POS";
import { Printer, CheckCircle, ArrowRight } from "lucide-react";

interface ReceiptProps {
  saleData: SaleData;
  onNewSale: () => void;
}

const Receipt = ({ saleData, onNewSale }: ReceiptProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 print:shadow-none">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
            <p className="text-muted-foreground">Sale #{saleData.sale_number}</p>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-3">Items</h2>
              <div className="space-y-2">
                {saleData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × KSh {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      KSh {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>KSh {saleData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (16%)</span>
                <span>KSh {saleData.tax.toFixed(2)}</span>
              </div>
              {saleData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-KSh {saleData.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">KSh {saleData.total.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{saleData.payment_method}</span>
              </div>
              {saleData.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{saleData.payment_reference}</span>
                </div>
              )}
              {saleData.customer_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{saleData.customer_name}</span>
                </div>
              )}
              {saleData.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{saleData.customer_phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">Powered by MoLabs POS System</p>
          </div>
        </Card>

        <div className="flex gap-4 mt-6 print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button
            onClick={onNewSale}
            className="flex-1"
          >
            New Sale
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
