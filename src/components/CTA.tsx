import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import patternBg from "@/assets/pattern-bg.jpg";

export const CTA = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${patternBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-br from-primary to-secondary rounded-3xl p-12 md:p-16 shadow-medium">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Join hundreds of Kenyan retailers who have already modernized their operations with MolabsPOS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="group">
              Start Your Free 30-Day Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/80">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};