import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Package, ShoppingCart, Users, BarChart3, FolderOpen, Tag } from "lucide-react";
import { LowStockAlert } from "@/components/admin/LowStockAlert";

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={new URL('../assets/molabs-logo.png', import.meta.url).href} alt="Molabs Tech Solutions" className="h-12" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h2>
          <p className="text-muted-foreground">Manage your POS system, inventory, and sales from here.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No products added yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES 0</div>
              <p className="text-xs text-muted-foreground">No sales recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Admin account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES 0</div>
              <p className="text-xs text-muted-foreground">No sales today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <LowStockAlert />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="default" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/pos")}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Point of Sale
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/products")}
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/categories")}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Product Categories
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/promotions")}
              >
                <Tag className="mr-2 h-4 w-4" />
                Promotions & Coupons
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/analytics")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/customers")}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Customers
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Add and manage your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/products")}>Manage Products</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales & Transactions</CardTitle>
              <CardDescription>View and process sales</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Sales</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage cashiers and staff</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/users")}>Manage Users</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>View detailed business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Reports</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>M-PESA Integration</CardTitle>
              <CardDescription>Configure payment settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Configure M-PESA</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>System configuration and security</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Open Settings</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Free Trial Status</CardTitle>
            <CardDescription>Your 15-day free trial is active</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You have 15 days remaining in your free trial. After the trial ends, you'll need to select a subscription plan to continue using the system.
            </p>
            <Button variant="outline">View Pricing Plans</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
