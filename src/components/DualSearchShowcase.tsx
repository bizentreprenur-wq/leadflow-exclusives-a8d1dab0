import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Globe, Search, MapPin, ArrowRight, CheckCircle2, 
  Code, Zap, Database, Filter, Users, TrendingUp,
  Sparkles, Play, Star
} from "lucide-react";
import SearchModule from "./SearchModule";

const DualSearchShowcase = () => {
  const [activeDemo, setActiveDemo] = useState<"gmb" | "platform">("gmb");

  const gmbFeatures = [
    { icon: MapPin, text: "Find local businesses with Google My Business listings" },
    { icon: Database, text: "Extract contact info, phone numbers, addresses" },
    { icon: Filter, text: "Filter by industry, rating, and website quality" },
    { icon: Zap, text: "Instant website analysis with mobile scores" },
  ];

  const platformFeatures = [
    { icon: Code, text: "Detect 16+ legacy platforms (WordPress, Wix, Joomla, etc.)" },
    { icon: Globe, text: "Search across Google AND Bing simultaneously" },
    { icon: TrendingUp, text: "Find businesses with outdated, slow websites" },
    { icon: Users, text: "Target businesses ready for modernization" },
  ];

  const platforms = [
    "WordPress", "Wix", "Weebly", "GoDaddy", "Squarespace", 
    "Joomla", "Drupal", "Magento", "OpenCart", "PrestaShop",
    "Zen Cart", "osCommerce", "Jimdo", "Web.com", "Custom PHP", "Custom HTML"
  ];

  return (
    <section data-tour="dual-search" className="py-20 md:py-32 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1.5 mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            TWO POWERFUL SEARCH METHODS
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Find Leads <span className="text-primary">Two Ways</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Whether you want to find local businesses through Google My Business or hunt for outdated websites 
            using our Platform Scanner - BamLead has you covered with <strong>real-time Google & Bing search</strong>.
          </p>
        </div>

        {/* Two Methods Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* GMB Search Card */}
          <div 
            className={`relative bg-card rounded-3xl border-2 p-8 transition-all duration-300 cursor-pointer ${
              activeDemo === "gmb" 
                ? "border-primary shadow-lg shadow-primary/20" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setActiveDemo("gmb")}
          >
            {activeDemo === "gmb" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Google My Business</h3>
                <p className="text-sm text-muted-foreground">Find local businesses with GMB listings</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {gmbFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2">Perfect For:</p>
              <p className="text-sm text-muted-foreground">
                Web designers, agencies, and marketers targeting local service businesses 
                (plumbers, dentists, lawyers, restaurants, etc.)
              </p>
            </div>
          </div>

          {/* Platform Scanner Card */}
          <div 
            className={`relative bg-card rounded-3xl border-2 p-8 transition-all duration-300 cursor-pointer ${
              activeDemo === "platform" 
                ? "border-accent shadow-lg shadow-accent/20" 
                : "border-border hover:border-accent/50"
            }`}
            onClick={() => setActiveDemo("platform")}
          >
            {activeDemo === "platform" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <Globe className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Platform Scanner</h3>
                <p className="text-sm text-muted-foreground">Find outdated websites via Google & Bing</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {platformFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-sm font-semibold text-accent mb-2">Perfect For:</p>
              <p className="text-sm text-muted-foreground">
                Developers looking for website redesign projects, finding businesses 
                stuck on legacy platforms that need modern solutions
              </p>
            </div>
          </div>
        </div>

        {/* Platform Detection List */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              <Code className="w-5 h-5 inline mr-2 text-accent" />
              16+ Platforms We Detect
            </h3>
            <p className="text-sm text-muted-foreground">Our scanner identifies businesses using these outdated or basic platforms</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {platforms.map((platform, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="px-4 py-2 text-sm bg-card hover:bg-accent/10 hover:border-accent/50 transition-colors"
              >
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        {/* Live Search Demo */}
        <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-elevated">
          <div className="text-center mb-8">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 mb-4">
              <Play className="h-3 w-3 mr-1" />
              LIVE DEMO
            </Badge>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Try Both Search Methods
            </h3>
            <p className="text-muted-foreground">
              Click the tabs below to switch between GMB Search and Platform Scanner
            </p>
          </div>

          <SearchModule />

          <div className="mt-8 text-center">
            <Link to="/pricing">
              <Button size="lg" className="rounded-full gap-2 bg-gradient-to-r from-primary to-accent">
                <Zap className="w-5 h-5" />
                Start Free Trial - Unlimited Searches
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { value: "60+", label: "Leads per search", icon: Users },
            { value: "16+", label: "Platforms detected", icon: Code },
            { value: "2", label: "Search engines", icon: Globe },
            { value: "24/7", label: "Always available", icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DualSearchShowcase;
