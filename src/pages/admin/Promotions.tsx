import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_quantity: number;
  coupon_code: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  current_uses: number;
  max_uses: number | null;
}

const Promotions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading promotions",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPromotions(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error deleting promotion",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });
      loadPromotions();
    }
    setDeleteId(null);
  };

  const filteredPromotions = promotions.filter((promo) =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (promo.coupon_code && promo.coupon_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Promotions</h1>
          </div>
          <Button onClick={() => navigate("/admin/promotions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Promotion
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.name}</TableCell>
                  <TableCell className="capitalize">{promo.discount_type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    {promo.discount_type === 'percentage' 
                      ? `${promo.discount_value}%` 
                      : `KES ${promo.discount_value}`}
                  </TableCell>
                  <TableCell>{promo.coupon_code || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(promo.start_date), 'MMM dd, yyyy')}
                    {promo.end_date && ` - ${format(new Date(promo.end_date), 'MMM dd, yyyy')}`}
                  </TableCell>
                  <TableCell>
                    {promo.current_uses || 0}
                    {promo.max_uses && ` / ${promo.max_uses}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/promotions/${promo.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(promo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promotion? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Promotions;
