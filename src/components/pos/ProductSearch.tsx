// =============================================================================
// PRODUCT SEARCH COMPONENT - Responsive POS Product Search
// Supports barcode scanning, search, and category filtering
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineStorage } from "@/lib/offline/storage";
import { formatCurrency } from "@/lib/pos/types";
import BarcodeScanner from "./BarcodeScanner";
import { cn } from "@/lib/utils";

interface ProductSearchProps {
  onProductSelect: (product: any) => void;
}

const ProductSearch = ({ onProductSelect }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    loadProducts();
  }, [isOnline]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.barcode?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);

      // Auto-select if exact barcode/SKU match
      if (filtered.length === 1 && (
        filtered[0].barcode?.toLowerCase() === searchLower || 
        filtered[0].sku?.toLowerCase() === searchLower
      )) {
        handleProductSelect(filtered[0]);
        setSearchTerm("");
      }
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .gt("stock_quantity", 0)
          .order("name");

        if (error) throw error;

        setProducts(data || []);
        
        // Cache products for offline use
        if (data && data.length > 0) {
          await offlineStorage.cacheProducts(data);
        }
      } else {
        // Load from cache when offline
        const cached = await offlineStorage.getCachedProducts();
        setProducts(cached.filter(p => p.is_active && p.stock_quantity > 0));
      }
    } catch (error: any) {
      console.error("Error loading products:", error);
      
      // Fallback to cache on error
      const cached = await offlineStorage.getCachedProducts();
      setProducts(cached.filter(p => p.is_active && p.stock_quantity > 0));
      
      if (isOnline) {
        toast({
          title: "Error loading products",
          description: "Using cached data",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, toast]);

  const handleProductSelect = (product: any) => {
    if (product.stock_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }
    onProductSelect(product);
    setSearchTerm("");
    setFilteredProducts([]);
  };

  const handleBarcodeScanned = (code: string) => {
    setSearchTerm(code);
  };

  return (
    <div className="space-y-3">
      {/* Search Input Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            placeholder="Search products, scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
            autoFocus
          />
        </div>
        <BarcodeScanner onScan={handleBarcodeScanned} />
      </div>

      {/* Search Results */}
      {filteredProducts.length > 0 && (
        <Card className="absolute z-50 left-0 right-0 mx-3 sm:mx-4 mt-1 shadow-lg max-h-[60vh] overflow-hidden">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2 space-y-1">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto py-3 px-3",
                    "hover:bg-accent transition-colors"
                  )}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Product Icon */}
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {product.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                        {product.barcode && (
                          <span className="text-xs text-muted-foreground">
                            • {product.barcode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock & Price */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm sm:text-base text-primary">
                        {formatCurrency(parseFloat(product.price))}
                      </p>
                      <Badge 
                        variant={product.stock_quantity <= (product.low_stock_threshold || 10) ? "destructive" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {product.stock_quantity} in stock
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* No Results */}
      {searchTerm && filteredProducts.length === 0 && !isLoading && (
        <Card className="absolute z-50 left-0 right-0 mx-3 sm:mx-4 mt-1 shadow-lg">
          <div className="p-6 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No products found for "{searchTerm}"</p>
          </div>
        </Card>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Showing cached products (offline mode)
        </p>
      )}
    </div>
  );
};

export default ProductSearch;
