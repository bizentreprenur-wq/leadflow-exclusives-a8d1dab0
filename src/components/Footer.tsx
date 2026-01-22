import { Link } from "react-router-dom";
import mascotLogo from "@/assets/bamlead-mascot.png";
import { MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { label: "What Is Bamlead", href: "/what-is-bamlead" },
      { label: "Features", href: "/features" },
      { label: "Capabilities", href: "/capabilities" },
      { label: "Pricing", href: "/pricing" },
    ],
    learn: [
      { label: "Use Cases", href: "/use-cases" },
      { label: "Example Searches", href: "/example-searches" },
      { label: "Data Types", href: "/data-types" },
      { label: "Comparisons", href: "/comparisons" },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Reviews", href: "/reviews" },
    ],
  };

  const address = {
    line1: "5900 Balcones Drive #STE 100",
    line2: "Austin, TX 78731, USA",
  };

  return (
    <footer className="py-16 border-t border-border bg-secondary/20">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-1 mb-4 group">
                <img 
                  src={mascotLogo} 
                  alt="BamLead Mascot" 
                  className="h-16 w-auto object-contain animate-mascot-bounce"
                />
                <span className="font-display font-bold text-xl text-foreground">
                  Bam<span className="text-primary">Lead</span>
                </span>
              </Link>
              <p className="text-muted-foreground max-w-sm mb-4">
                AI-powered B2B lead generation and sales intelligence platform. Find, verify, and engage prospects efficiently.
              </p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p>{address.line1}</p>
                  <p>{address.line2}</p>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learn Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Learn</h4>
              <ul className="space-y-3">
                {footerLinks.learn.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BamLead. All rights reserved. <span className="text-primary/60">v1.0.1</span>
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;