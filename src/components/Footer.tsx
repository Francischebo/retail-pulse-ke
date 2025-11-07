export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={new URL('../assets/molabs-logo.png', import.meta.url).href} alt="Molabs Tech Solutions" className="h-10" />
            </div>
            <p className="text-sm text-muted-foreground">
              The complete POS solution for Kenyan retailers. Built for Africa, powered by innovation.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong>{" "}
                <a href="mailto:molabstechsolutions@gmail.com" className="hover:text-primary transition-colors">
                  molabstechsolutions@gmail.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>WhatsApp:</strong>{" "}
                <a href="https://wa.me/254740411091" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  +254 740 411 091
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#demo" className="hover:text-primary transition-colors">Demo</a></li>
              <li><a href="#integrations" className="hover:text-primary transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#blog" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#careers" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#help" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#docs" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 MolabsPOS. All rights reserved. Built with ❤️ in Kenya.</p>
        </div>
      </div>
    </footer>
  );
};