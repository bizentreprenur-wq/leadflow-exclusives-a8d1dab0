import { Link } from "react-router-dom";
import mascotLogo from "@/assets/bamlead-mascot.png";
import { MapPin, ShieldCheck, Lock, CreditCard } from "lucide-react";

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

  // Payment card SVG components
  const VisaLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="white"/>
      <path d="M19.5 21H17L18.8 11H21.3L19.5 21Z" fill="#1434CB"/>
      <path d="M28.5 11.2C28 11 27.2 10.8 26.2 10.8C23.7 10.8 22 12.1 22 14C22 15.4 23.3 16.2 24.3 16.7C25.3 17.2 25.7 17.5 25.7 18C25.7 18.7 24.8 19 24 19C22.9 19 22.3 18.8 21.4 18.4L21 18.2L20.6 20.7C21.3 21 22.5 21.2 23.8 21.2C26.5 21.2 28.2 19.9 28.2 17.9C28.2 16.8 27.5 15.9 26 15.2C25.1 14.7 24.5 14.4 24.5 13.8C24.5 13.3 25.1 12.8 26.2 12.8C27.1 12.8 27.7 13 28.2 13.2L28.5 13.3L28.9 11L28.5 11.2Z" fill="#1434CB"/>
      <path d="M33.5 11H31.5C30.9 11 30.4 11.2 30.1 11.8L26.5 21H29.2L29.7 19.5H33L33.3 21H35.7L33.5 11ZM30.5 17.5C30.7 16.9 31.7 14.2 31.7 14.2C31.7 14.2 32 13.4 32.1 12.9L32.4 14.1C32.4 14.1 33 16.7 33.1 17.5H30.5Z" fill="#1434CB"/>
      <path d="M16 11L13.5 17.8L13.2 16.3C12.7 14.6 11.1 12.8 9.3 11.9L11.6 21H14.3L18.7 11H16Z" fill="#1434CB"/>
      <path d="M11.5 11H7.3L7.25 11.2C10.5 12 12.7 14 13.5 16.3L12.7 11.8C12.5 11.2 12 11 11.5 11Z" fill="#F9A533"/>
    </svg>
  );

  const MastercardLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="white"/>
      <circle cx="19" cy="16" r="8" fill="#EB001B"/>
      <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
      <path d="M24 10.3C25.8 11.7 27 13.7 27 16C27 18.3 25.8 20.3 24 21.7C22.2 20.3 21 18.3 21 16C21 13.7 22.2 11.7 24 10.3Z" fill="#FF5F00"/>
    </svg>
  );

  const AmexLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#006FCF"/>
      <path d="M10 16.5L11.5 13H13L15 17.5V13H17.5L18.5 15.5L19.5 13H22V19H20L20 15L18.5 19H17.5L16 15V19H12.5L12 18H10.5L10 19H8L10 16.5ZM11 16.5L11.5 15L12 16.5H11Z" fill="white"/>
      <path d="M22.5 13H28L29 14V15L28 16L29 17V18L28 19H22.5V13ZM24.5 15.5H26.5V14.5H24.5V15.5ZM24.5 17.5H26.5V16.5H24.5V17.5Z" fill="white"/>
      <path d="M29.5 13H32L34 15.5V13H36V19H34L32 16.5V19H29.5V13Z" fill="white"/>
      <path d="M37 13H40L42 19H39.5L39 18H37.5L37 19H35L37 13ZM38 16.5L38.5 15L39 16.5H38Z" fill="white"/>
    </svg>
  );

  const DiscoverLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="white"/>
      <rect x="0" y="16" width="48" height="16" rx="0" fill="#F47216"/>
      <circle cx="30" cy="16" r="7" fill="#F47216"/>
      <text x="8" y="14" fill="#1A1F71" fontSize="6" fontWeight="bold" fontFamily="Arial">DISCOVER</text>
    </svg>
  );

  const PaypalLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="white"/>
      <path d="M17.5 8H22.5C25.5 8 27 9.5 26.5 12C26 15 23.5 16.5 20.5 16.5H19L18 22H14.5L17.5 8Z" fill="#003087"/>
      <path d="M20 10.5H22C23.5 10.5 24 11 24 12C23.8 13.5 22.5 14 21.5 14H20.5L20 10.5Z" fill="white"/>
      <path d="M25 10H30C33 10 34.5 11.5 34 14C33.5 17 31 18.5 28 18.5H26.5L25.5 24H22L25 10Z" fill="#009CDE"/>
      <path d="M27.5 12.5H29.5C31 12.5 31.5 13 31.5 14C31.3 15.5 30 16 29 16H28L27.5 12.5Z" fill="white"/>
    </svg>
  );

  const StripeLogo = () => (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#635BFF"/>
      <path d="M22 13C22 12.2 22.6 11.8 23.6 11.8C25.1 11.8 27 12.4 28.5 13.3V9.5C26.9 8.8 25.3 8.5 23.6 8.5C20 8.5 17.5 10.5 17.5 13.5C17.5 18.2 24 17.3 24 19.3C24 20.2 23.2 20.6 22.1 20.6C20.4 20.6 18.3 19.8 16.7 18.8V22.7C18.5 23.5 20.3 23.9 22.1 23.9C25.8 23.9 28.5 22 28.5 18.9C28.5 13.8 22 14.9 22 13Z" fill="white"/>
    </svg>
  );

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

          {/* Trust Badges & Payment Methods */}
          <div className="py-8 border-t border-border">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-foreground">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                  <Lock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">PCI Compliant</span>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">We Accept</span>
                <div className="flex items-center gap-2">
                  <VisaLogo />
                  <MastercardLogo />
                  <AmexLogo />
                  <DiscoverLogo />
                  <PaypalLogo />
                  <StripeLogo />
                </div>
              </div>
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