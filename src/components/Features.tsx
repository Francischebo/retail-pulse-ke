import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Wifi, 
  BarChart3, 
  Package, 
  Users, 
  ShieldCheck 
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "M-PESA Integration",
    description: "Seamless integration with M-PESA, Airtel Money, and all major Kenyan payment methods. Accept payments instantly."
  },
  {
    icon: Wifi,
    title: "Offline-First",
    description: "Continue selling even without internet. All transactions sync automatically when connection returns."
  },
  {
    icon: Package,
    title: "Smart Inventory",
    description: "Track stock levels, expiry dates, and get automatic low-stock alerts. FIFO selling built-in."
  },
  {
    icon: BarChart3,
    title: "Advanced Reports",
    description: "Daily, weekly, monthly reports with date filters. Export to PDF or Excel for KRA compliance."
  },
  {
    icon: Users,
    title: "Customer Loyalty",
    description: "SMS-based loyalty program using phone numbers. Reward your repeat customers automatically."
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    description: "Bank-level security with automatic KRA tax calculations. Your data is always protected."
  }
];

export const Features = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Everything You Need to Run Your Store
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for the Kenyan retail market
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border hover:shadow-soft transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};