import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";

export const Demo = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            See How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch our quick demo to see how our POS system can transform your business operations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm mb-4 hover:bg-primary/30 transition-all cursor-pointer">
                    <Play className="h-10 w-10 text-primary ml-1" />
                  </div>
                  <p className="text-lg font-medium text-foreground">Demo Video Coming Soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    We're preparing an in-depth walkthrough of our POS system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Quick Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Get started in minutes with our easy onboarding process
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Process Sales</h3>
                <p className="text-sm text-muted-foreground">
                  Handle transactions seamlessly with M-PESA and cash
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Track & Grow</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor inventory and analyze sales in real-time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
