import { Brain, Search, Mail, Phone, Zap, Target, Download, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const highlights = [
  { icon: Search, text: "10 AI research categories with 100+ data points per lead" },
  { icon: Zap, text: "Real-time website analysis — CMS, speed, SEO, tech stack" },
  { icon: Target, text: "AI lead scoring: Hot, Warm & Cold classifications" },
  { icon: Mail, text: "Multi-channel outreach — Email, SMS & AI Voice Calling" },
  { icon: Shield, text: "Contact verification & decision-maker identification" },
  { icon: Download, text: "Export reports as PDF, Excel, or to Google Drive" },
];

const WhatIsBamleadSection = () => {
  return (
    <section className="py-16 md:py-24 bg-card border-y border-border">
      <div className="container px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            The Platform
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            What Is <span className="text-primary">BamLead</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            BamLead is a 3-in-1 <strong className="text-foreground">market intelligence</strong> and{" "}
            <strong className="text-foreground">AI-powered outreach engine</strong> that helps businesses find, analyze, 
            and contact high-intent prospects — all from one platform.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">
          {/* Left: Description */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Intelligence, Not Scraping</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Unlike traditional lead scrapers, BamLead aggregates real-time data before displaying it. 
                The platform separates <strong className="text-foreground">intelligence</strong> (niche research, 
                competitive analysis, SWOT, buyer matching) from <strong className="text-foreground">prospecting</strong> (email, 
                voice calling, autopilot sequences) — so you sell smarter, not harder.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Two Search Modes</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">A</span>
                  <span><strong className="text-foreground">Super AI Business Search</strong> — Deep 12-category intelligence for niche-selling with synonym expansion (2,000+ leads per search).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">B</span>
                  <span><strong className="text-foreground">Agency Lead Finder</strong> — High-volume discovery optimized for SaaS, SMMA, marketing agencies, and web designers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Feature checklist */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground mb-4">What You Get</h3>
            {highlights.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/what-is-bamlead">
              Read the full breakdown
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WhatIsBamleadSection;
