import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, User, Tag } from "lucide-react";
import { CartItem } from "@/lib/pos/types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/pos/types";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  selectedCustomer?: any;
  onCustomerChange?: (customer: any) => void;
  appliedCoupon?: string | null;
  onApplyCoupon?: (code: string) => Promise<boolean>;
  onRemoveCoupon?: () => void;
  discount?: number;
}

const Cart = ({ 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onClear, 
  onCheckout,
  selectedCustomer,
  onCustomerChange,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  discount = 0,
}: CartProps) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: async () => {
      let query = supabase.from("customers").select("*").limit(10);
      
      if (customerSearch) {
        query = query.or(`full_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalAfterDiscount = subtotal - discount;
  const tax = subtotalAfterDiscount * 0.16; // 16% VAT
  const total = subtotalAfterDiscount + tax;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;
    
    setIsApplyingCoupon(true);
    const success = await onApplyCoupon(couponCode.trim().toUpperCase());
    if (success) {
      setCouponCode("");
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon?.();
    setCouponCode("");
  };

  return (
    <Card className="p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="text-xl font-bold">Cart</h2>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-destructive"
          >
            Clear
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {items.length > 0 && onCustomerChange && (
        <div className="mb-4 space-y-2">
          <Label htmlFor="customer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer (Optional)
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedCustomer ? selectedCustomer.full_name : "Select customer..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Search customers..." 
                  value={customerSearch}
                  onValueChange={setCustomerSearch}
                />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers?.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          onCustomerChange(customer);
                          setOpen(false);
                        }}
                      >
                        <div>
                          <div className="font-medium">{customer.full_name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedCustomer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCustomerChange(null)}
              className="w-full"
            >
              Clear selection
            </Button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>Cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} each
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 h-8"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {item.stock} available
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="mt-1 text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator className="my-4" />

          {onApplyCoupon && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Coupon Code (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon || isApplyingCoupon}
                />
                {appliedCoupon ? (
                  <Button
                    variant="outline"
                    onClick={handleRemoveCoupon}
                    size="sm"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleApplyCoupon}
                    size="sm"
                    disabled={isApplyingCoupon}
                  >
                    Apply
                  </Button>
                )}
              </div>
              {appliedCoupon && (
                <Badge variant="secondary" className="text-green-600">
                  Coupon: {appliedCoupon}
                </Badge>
              )}
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>VAT (16%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            onClick={onCheckout}
            className="w-full mt-4"
            size="lg"
          >
            Checkout
          </Button>
        </>
      )}
    </Card>
  );
};

export default Cart;
