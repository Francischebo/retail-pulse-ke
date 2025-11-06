import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "9,999",
    period: "per month",
    description: "Perfect for small shops and kiosks",
    features: [
      "1 POS terminal",
      "Unlimited transactions",
      "M-PESA integration",
      "Basic inventory tracking",
      "Cash reconciliation",
      "Email support"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: "24,999",
    period: "per month",
    description: "Ideal for growing supermarkets",
    features: [
      "Up to 5 POS terminals",
      "Unlimited transactions",
      "All payment methods",
      "Advanced inventory & alerts",
      "Customer loyalty program",
      "Supplier SMS alerts",
      "Advanced reports & analytics",
      "Priority support"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored pricing",
    description: "For chains and large retailers",
    features: [
      "Unlimited POS terminals",
      "Multi-location support",
      "Franchise management",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "Custom training",
      "API access"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 30-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-medium scale-105' : 'border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price !== "Custom" && "KES "}
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};