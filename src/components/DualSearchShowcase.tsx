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
    { icon: MapPin, text: "Find any business with comprehensive AI analysis" },
    { icon: Database, text: "Get complete contact info, phone, email, address" },
    { icon: Filter, text: "100+ data points: website health, reviews, social, tracking" },
    { icon: Zap, text: "AI scoring with personalized sales intelligence" },
  ];

  const platformFeatures = [
    { icon: Code, text: "Find businesses with broken or outdated websites" },
    { icon: Globe, text: "Detect weak social media presence & missing reviews" },
    { icon: TrendingUp, text: "Identify missing tracking pixels & retargeting" },
    { icon: Users, text: "Perfect for web designers, social media marketers & agencies" },
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
            🤖 TWO POWERFUL AI SEARCH METHODS
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Find Leads <span className="text-primary">Your Way</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Use our Super AI Business Search for comprehensive intelligence on any business, or the Agency Lead Finder 
            to discover clients who need your digital expertise — BamLead helps you close your next deal.
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">🤖 Super AI Business Search</h3>
                <p className="text-sm text-muted-foreground">Advanced business intelligence for any lead</p>
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
                Sales teams, SDRs, agencies, SaaS companies, investors, and anyone who needs 
                comprehensive intelligence on businesses to call or email
              </p>
            </div>
          </div>

          {/* Agency Lead Finder Card */}
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
                <h3 className="text-2xl font-display font-bold text-foreground">Agency Lead Finder</h3>
                <p className="text-sm text-muted-foreground">Built for digital professionals</p>
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
                Website designers, social media marketers & digital agencies looking for 
                clients who need professional help with their online presence
              </p>
            </div>
          </div>
        </div>

        {/* AI Intelligence Features List */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              <Zap className="w-5 h-5 inline mr-2 text-primary" />
              Super AI Detects & Analyzes
            </h3>
            <p className="text-sm text-muted-foreground">Our AI analyzes every aspect of a business for comprehensive intelligence</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto">
            {[
              "Website Health", "Mobile Score", "Page Speed", "SSL Status",
              "Google Reviews", "Rating Score", "Review Velocity", "Owner Responses",
              "Facebook", "Instagram", "LinkedIn", "Social Activity",
              "GA4 Tracking", "Facebook Pixel", "GTM", "Call Tracking",
              "Booking System", "Contact Forms", "Live Chat", "Trust Badges",
              "Business Hours", "Service Area", "Years in Business", "Owner Info"
            ].map((item, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="px-4 py-2 text-sm bg-card hover:bg-primary/10 hover:border-primary/50 transition-colors"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Live Search Demo */}
        <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-elevated">
          <div className="text-center mb-8">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 mb-4">
              <Play className="h-3 w-3 mr-1" />
              🤖 LIVE AI DEMO
            </Badge>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Try Both AI Search Methods
            </h3>
            <p className="text-muted-foreground">
              Experience the power of Super AI Business Search and Agency Lead Finder
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
            { value: "100+", label: "Data points analyzed", icon: Database },
            { value: "AI", label: "Powered scoring", icon: Sparkles },
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
