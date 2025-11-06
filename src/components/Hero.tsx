import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-pos.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                The Complete <span className="text-primary">POS System</span> for Kenyan Retailers
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                Built for Kenya. Powered by M-PESA. Works offline. Scale from your first sale to thousands of transactions daily.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="hero" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                "M-PESA & Mobile Money",
                "Works 100% Offline",
                "Real-time Inventory",
                "KRA Tax Compliant"
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:h-[600px]">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-medium">
              <img 
                src={heroImage} 
                alt="MolabsPOS - Modern POS system in action at a Kenyan retail store"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};