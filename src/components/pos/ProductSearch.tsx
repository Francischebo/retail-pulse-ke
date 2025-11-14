import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Barcode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BarcodeScanner from "./BarcodeScanner";

interface ProductSearchProps {
  onProductSelect: (product: any) => void;
}

const ProductSearch = ({ onProductSelect }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode?.includes(searchTerm) ||
          product.sku?.includes(searchTerm)
      );
      setFilteredProducts(filtered);

      // Auto-select if exact barcode/SKU match
      if (filtered.length === 1 && (
        filtered[0].barcode === searchTerm || 
        filtered[0].sku === searchTerm
      )) {
        handleProductSelect(filtered[0]);
        setSearchTerm("");
      }
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("name");

    if (error) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
  };

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
    <div className="space-y-4">
      <div className="relative flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, barcode, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-lg h-12"
            autoFocus
          />
        </div>
        <BarcodeScanner onScan={handleBarcodeScanned} />
      </div>

      {filteredProducts.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleProductSelect(product)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.sku && `SKU: ${product.sku}`}
                    {product.barcode && ` • Barcode: ${product.barcode}`}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={product.stock_quantity <= product.low_stock_threshold ? "destructive" : "secondary"}>
                      Stock: {product.stock_quantity}
                    </Badge>
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    KSh {parseFloat(product.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
