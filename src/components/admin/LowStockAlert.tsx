import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string | null;
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLowStockProducts();
    
    // Set up realtime subscription for product changes
    const channel = supabase
      .channel('low-stock-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          loadLowStockProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLowStockProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold, category")
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true });

      if (error) throw error;

      const lowStock = data?.filter(
        (product) => product.stock_quantity <= product.low_stock_threshold
      ) || [];

      setLowStockProducts(lowStock);

      // Show toast notification if there are critical low stock items
      const criticalItems = lowStock.filter(p => p.stock_quantity === 0);
      if (criticalItems.length > 0) {
        toast({
          title: "⚠️ Critical Stock Alert",
          description: `${criticalItems.length} product(s) are out of stock!`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error loading low stock products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Low Stock Alert
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alert
        </CardTitle>
        <CardDescription>
          Products that need restocking ({lowStockProducts.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>All products are well stocked!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  {product.category && (
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Stock: {product.stock_quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Threshold: {product.low_stock_threshold}
                    </p>
                  </div>
                  <Badge 
                    variant={product.stock_quantity === 0 ? "destructive" : "secondary"}
                  >
                    {product.stock_quantity === 0 ? "Out of Stock" : "Low"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
