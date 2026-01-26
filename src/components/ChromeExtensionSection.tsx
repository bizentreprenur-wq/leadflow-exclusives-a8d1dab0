import { Chrome, MousePointer, Download, Zap, Mail, Globe, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChromeExtensionSection = () => {
  const features = [
    {
      icon: MousePointer,
      title: "One-Click Extraction",
      description: "Extract emails, phones, and social links from any webpage"
    },
    {
      icon: Globe,
      title: "Platform Detection",
      description: "Instantly identify what CMS or platform a website uses"
    },
    {
      icon: Download,
      title: "Save to Dashboard",
      description: "Send leads directly to your BamLead dashboard"
    }
  ];

  const browsers = [
    { name: "Chrome", color: "text-[#4285F4]" },
    { name: "Edge", color: "text-[#0078D7]" },
    { name: "Brave", color: "text-[#FB542B]" },
    { name: "Opera", color: "text-[#FF1B2D]" },
  ];

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="container px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
              <Globe className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-warning">Browser Extension</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Find leads while
              <br />
              <span className="text-warning">you browse</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Our browser extension lets you extract contact information and analyze websites without leaving your browser.
            </p>

            {/* Browser compatibility badges */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground">Works on:</span>
              {browsers.map((browser) => (
                <span 
                  key={browser.name}
                  className={`px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium ${browser.color}`}
                >
                  {browser.name}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">& more</span>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="rounded-full gap-2" variant="outline">
              <Chrome className="w-4 h-4" />
              Download Extension
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Manual installation required • See installation guide
            </p>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elevated">
              {/* Browser mockup header */}
              <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 bg-secondary rounded-full px-4 py-1.5">
                  <span className="text-xs text-muted-foreground">example-business.com</span>
                </div>
              </div>

              {/* Extension popup mockup */}
              <div className="bg-background rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">BamLead Extractor</p>
                    <p className="text-xs text-muted-foreground">3 contacts found</p>
                  </div>
                </div>

                {/* Extracted data */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    <Mail className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground">contact@example.com</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    <Phone className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Platform: WordPress 5.2</span>
                  </div>
                </div>

                <Button className="w-full mt-4 rounded-lg" size="sm">
                  Save to Dashboard
                </Button>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 px-4 py-2 bg-success rounded-full shadow-lg">
              <span className="text-sm font-semibold text-success-foreground">Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChromeExtensionSection;
