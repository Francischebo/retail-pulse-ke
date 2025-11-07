import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  batch_number: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  price: z.number().min(0, "Price must be positive"),
  cost: z.number().min(0, "Cost must be positive").optional(),
  stock_quantity: z.number().int().min(0, "Stock must be positive"),
  low_stock_threshold: z.number().int().min(0, "Threshold must be positive"),
  expiry_date: z.string().optional(),
  is_active: z.boolean(),
});

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    batch_number: product?.batch_number || "",
    category: product?.category || "",
    price: product?.price || 0,
    cost: product?.cost || 0,
    stock_quantity: product?.stock_quantity || 0,
    low_stock_threshold: product?.low_stock_threshold || 10,
    expiry_date: product?.expiry_date || "",
    is_active: product?.is_active ?? true,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = productSchema.parse(formData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const productData = {
        ...validatedData,
        description: validatedData.description || null,
        sku: validatedData.sku || null,
        barcode: validatedData.barcode || null,
        batch_number: validatedData.batch_number || null,
        category: validatedData.category || null,
        cost: validatedData.cost || null,
        expiry_date: validatedData.expiry_date || null,
        created_by: session.user.id,
      };

      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;

        toast({
          title: "Product updated",
          description: "Product has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Product added",
          description: "New product has been added successfully.",
        });
      }

      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving product",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Add New Product"}</CardTitle>
        <CardDescription>
          {product ? "Update product information" : "Add a new product to your inventory"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (KES)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Alert Threshold *</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Product is active</Label>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? "Update Product" : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
