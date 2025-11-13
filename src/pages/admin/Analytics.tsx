import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { DollarSign, Package, CreditCard, Users } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  // Fetch daily sales data
  const { data: dailySales } = useQuery({
    queryKey: ["daily-sales"],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, "yyyy-MM-dd"),
          start: startOfDay(date).toISOString(),
          end: endOfDay(date).toISOString(),
        };
      });

      const results = await Promise.all(
        last7Days.map(async ({ date, start, end }) => {
          const { data } = await supabase
            .from("sales")
            .select("total")
            .gte("created_at", start)
            .lte("created_at", end);

          const total = data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
          return { date: format(new Date(date), "MMM dd"), total };
        })
      );

      return results;
    },
  });

  // Fetch monthly sales data
  const { data: monthlySales } = useQuery({
    queryKey: ["monthly-sales"],
    queryFn: async () => {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return {
          month: format(date, "yyyy-MM"),
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString(),
        };
      });

      const results = await Promise.all(
        last6Months.map(async ({ month, start, end }) => {
          const { data } = await supabase
            .from("sales")
            .select("total")
            .gte("created_at", start)
            .lte("created_at", end);

          const total = data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
          return { month: format(new Date(month), "MMM yyyy"), total };
        })
      );

      return results;
    },
  });

  // Fetch top products
  const { data: topProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_items")
        .select("product_name, quantity, subtotal")
        .order("created_at", { ascending: false });

      const productMap = new Map();
      data?.forEach((item) => {
        const existing = productMap.get(item.product_name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.subtotal);
        } else {
          productMap.set(item.product_name, {
            name: item.product_name,
            quantity: item.quantity,
            revenue: Number(item.subtotal),
          });
        }
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
  });

  // Fetch payment methods breakdown
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("payment_method, total");

      const methodMap = new Map();
      data?.forEach((sale) => {
        const existing = methodMap.get(sale.payment_method);
        if (existing) {
          existing.value += Number(sale.total);
          existing.count += 1;
        } else {
          methodMap.set(sale.payment_method, {
            name: sale.payment_method.toUpperCase().replace("_", " "),
            value: Number(sale.total),
            count: 1,
          });
        }
      });

      return Array.from(methodMap.values());
    },
  });

  // Fetch cashier performance
  const { data: cashierPerformance } = useQuery({
    queryKey: ["cashier-performance"],
    queryFn: async () => {
      const { data: sales } = await supabase
        .from("sales")
        .select("cashier_id, total, created_at");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      const cashierMap = new Map();
      sales?.forEach((sale) => {
        const existing = cashierMap.get(sale.cashier_id);
        if (existing) {
          existing.sales += Number(sale.total);
          existing.transactions += 1;
        } else {
          cashierMap.set(sale.cashier_id, {
            id: sale.cashier_id,
            sales: Number(sale.total),
            transactions: 1,
          });
        }
      });

      return Array.from(cashierMap.values()).map((cashier) => {
        const profile = profiles?.find((p) => p.id === cashier.id);
        return {
          name: profile?.full_name || "Unknown",
          sales: cashier.sales,
          transactions: cashier.transactions,
        };
      }).sort((a, b) => b.sales - a.sales);
    },
  });

  // Calculate summary stats
  const totalRevenue = dailySales?.reduce((sum, day) => sum + day.total, 0) || 0;
  const totalTransactions = paymentMethods?.reduce((sum, method) => sum + method.count, 0) || 0;
  const totalProducts = topProducts?.reduce((sum, product) => sum + product.quantity, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (7 days)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cashiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashierPerformance?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="cashiers">Cashier Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Last 7 days revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value) => `KSH ${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Trend</CardTitle>
              <CardDescription>Last 6 months revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value) => `KSH ${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value) => `KSH ${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--secondary))" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Breakdown</CardTitle>
              <CardDescription>Distribution by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {paymentMethods?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value) => `KSH ${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cashier Performance</CardTitle>
              <CardDescription>Sales and transactions by cashier</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={cashierPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value, name) => [
                      name === "sales" ? `KSH ${Number(value).toFixed(2)}` : value,
                      name === "sales" ? "Revenue" : "Transactions"
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Revenue" />
                  <Bar dataKey="transactions" fill="hsl(var(--accent))" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
