import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Demo } from "@/components/Demo";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="demo">
          <Demo />
        </div>
        <div id="pricing">
          <Pricing />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <div id="faq">
          <FAQ />
        </div>
        <div id="contact">
          <Contact />
        </div>
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
