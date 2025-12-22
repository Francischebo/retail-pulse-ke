import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Warehouse, AlertTriangle, PackagePlus, PackageMinus, History, RefreshCw } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  reorder_point: number | null;
  reorder_quantity: number | null;
  supplier_id: string | null;
}

interface StockAdjustment {
  id: string;
  product_id: string;
  adjustment_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  reference_number: string | null;
  created_at: string;
  products?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<string>("add");
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: "",
    reason: "",
    reference_number: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, adjustmentsRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, stock_quantity, low_stock_threshold").order("name"),
        (supabase as any).from("stock_adjustments").select("*, products(name)").order("created_at", { ascending: false }).limit(50),
        (supabase as any).from("suppliers").select("id, name").eq("is_active", true),
      ]);

      if (productsRes.error) throw productsRes.error;
      setProducts((productsRes.data || []).map((p: any) => ({ ...p, reorder_point: p.reorder_point || 10, reorder_quantity: p.reorder_quantity || 50, supplier_id: p.supplier_id || null })));
      setAdjustments((adjustmentsRes.data as StockAdjustment[]) || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    const quantity = parseInt(adjustmentData.quantity);
    const currentStock = selectedProduct.stock_quantity || 0;
    let newQuantity = currentStock;

    if (adjustmentType === "add" || adjustmentType === "return" || adjustmentType === "restock") {
      newQuantity = currentStock + quantity;
    } else if (adjustmentType === "remove" || adjustmentType === "damage") {
      newQuantity = Math.max(0, currentStock - quantity);
    } else if (adjustmentType === "count") {
      newQuantity = quantity;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("stock_adjustments").insert({
        product_id: selectedProduct.id,
        adjustment_type: adjustmentType,
        quantity: adjustmentType === "count" ? newQuantity - currentStock : quantity,
        previous_quantity: currentStock,
        new_quantity: newQuantity,
        reason: adjustmentData.reason || null,
        reference_number: adjustmentData.reference_number || null,
        adjusted_by: user.id,
      });

      if (error) throw error;

      // Update product stock directly since trigger might not exist yet
      await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", selectedProduct.id);

      toast({ title: "Success", description: "Stock adjusted successfully" });
      setIsAdjustDialogOpen(false);
      resetAdjustmentForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentData({ quantity: "", reason: "", reference_number: "" });
    setAdjustmentType("add");
    setSelectedProduct(null);
  };

  const openAdjustDialog = (product: Product, type: string) => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setIsAdjustDialogOpen(true);
  };

  const lowStockProducts = products.filter(
    (p) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 10)
  );

  const reorderProducts = products.filter(
    (p) => (p.stock_quantity || 0) <= (p.reorder_point || 10)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case "add":
      case "return":
      case "restock":
        return <Badge className="bg-green-500">+{type}</Badge>;
      case "remove":
      case "damage":
        return <Badge variant="destructive">-{type}</Badge>;
      case "count":
        return <Badge variant="secondary">{type}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <AdminLayout title="Inventory Management">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card className={lowStockProducts.length > 0 ? "border-yellow-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          <Card className={reorderProducts.length > 0 ? "border-red-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-red-500" />
                Need Reorder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{reorderProducts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="reorder">Reorder</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>View and adjust product stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead className="text-center">Low Threshold</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          const stock = product.stock_quantity || 0;
                          const threshold = product.low_stock_threshold || 10;
                          const isLowStock = stock <= threshold;
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.sku || "-"}</TableCell>
                              <TableCell className="text-center font-mono">{stock}</TableCell>
                              <TableCell className="text-center">{threshold}</TableCell>
                              <TableCell className="text-center">
                                {isLowStock ? (
                                  <Badge variant="destructive">Low Stock</Badge>
                                ) : (
                                  <Badge variant="secondary">In Stock</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAdjustDialog(product, "add")}
                                  >
                                    <PackagePlus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAdjustDialog(product, "remove")}
                                  >
                                    <PackageMinus className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reorder">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Reorder Tracking
                </CardTitle>
                <CardDescription>Products that need to be reordered</CardDescription>
              </CardHeader>
              <CardContent>
                {reorderProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    All products are above reorder point
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-center">Current Stock</TableHead>
                          <TableHead className="text-center">Reorder Point</TableHead>
                          <TableHead className="text-center">Suggested Order Qty</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reorderProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku || "-"}</TableCell>
                            <TableCell className="text-center font-mono text-red-500">
                              {product.stock_quantity || 0}
                            </TableCell>
                            <TableCell className="text-center">{product.reorder_point || 10}</TableCell>
                            <TableCell className="text-center">{product.reorder_quantity || 50}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => openAdjustDialog(product, "restock")}
                              >
                                <PackagePlus className="h-4 w-4 mr-1" />
                                Restock
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Adjustment History
                </CardTitle>
                <CardDescription>Recent stock adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                {adjustments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock adjustments recorded yet
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Qty Change</TableHead>
                          <TableHead className="text-center">Before → After</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustments.map((adj) => (
                          <TableRow key={adj.id}>
                            <TableCell className="text-sm">
                              {new Date(adj.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {adj.products?.name || "Unknown"}
                            </TableCell>
                            <TableCell>{getAdjustmentTypeBadge(adj.adjustment_type)}</TableCell>
                            <TableCell className="text-center font-mono">
                              {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {adj.previous_quantity} → {adj.new_quantity}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {adj.reason || "-"}
                            </TableCell>
                            <TableCell>{adj.reference_number || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stock Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={(open) => {
          setIsAdjustDialogOpen(open);
          if (!open) resetAdjustmentForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Current stock: {selectedProduct?.stock_quantity || 0} units
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <Label htmlFor="adjustment_type">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                    <SelectItem value="count">Stock Count</SelectItem>
                    <SelectItem value="damage">Damaged/Lost</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="restock">Restock from Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">
                  {adjustmentType === "count" ? "New Stock Count" : "Quantity"}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={adjustmentData.quantity}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={adjustmentData.reason}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, reason: e.target.value })
                  }
                  rows={2}
                  placeholder="Optional reason for adjustment"
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={adjustmentData.reference_number}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, reference_number: e.target.value })
                  }
                  placeholder="e.g., PO-12345, RMA-001"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Adjustment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
