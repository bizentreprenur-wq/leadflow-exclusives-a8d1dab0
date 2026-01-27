import { Mail, Send, Clock, FileText, BarChart3, Users, CheckCircle2, ArrowRight, Sparkles, Wand2, Brain, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EmailOutreachSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: "AI Template Suggestions",
      description: "AI analyzes your leads and recommends the best-converting templates for their industry",
      stat: "Smart",
      isNew: true
    },
    {
      icon: Wand2,
      title: "AI Email Assistant",
      description: "Get personalized subject lines, openers, and CTAs with one click",
      stat: "1-Click",
      isNew: true
    },
    {
      icon: Brain,
      title: "Industry Detection",
      description: "Automatically detects lead industries for targeted outreach",
      stat: "Auto",
      isNew: true
    },
    {
      icon: Target,
      title: "Smart Personalization",
      description: "AI creates unique messages based on each lead's business details",
      stat: "100%",
      isNew: true
    },
    {
      icon: FileText,
      title: "Email Templates",
      description: "12+ professionally crafted templates for sales, marketing, and recruiting",
      stat: "12+"
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Send at optimal times or schedule for specific dates",
      stat: "3x"
    },
    {
      icon: BarChart3,
      title: "Campaign Analytics",
      description: "Track opens, replies, conversions, and bounce rates",
      stat: "Real-time"
    },
    {
      icon: Users,
      title: "Lead Verification",
      description: "AI validates emails and scores leads before outreach",
      stat: "95%"
    }
  ];

  const templateCategories = [
    "Sales Outreach",
    "Marketing",
    "Recruiting",
    "Networking",
    "Follow-up",
    "Introduction"
  ];

  return (
    <section data-tour="email-outreach" className="py-12 md:py-16 bg-card relative overflow-hidden">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">AI-Powered Email Outreach</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            AI writes your emails
            <br />
            <span className="text-accent">you just click send</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes your leads, suggests the perfect templates, and writes personalized content automatically
          </p>
          
          {/* New Feature Highlight */}
          <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20">
            <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0">NEW</Badge>
            <span className="text-sm font-medium text-foreground">AI Template Suggestions + AI Email Assistant now available!</span>
          </div>
        </div>

        {/* Main Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left - Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-background rounded-2xl border p-6 transition-all duration-300 relative ${
                  feature.isNew 
                    ? 'border-primary/50 hover:border-primary shadow-lg shadow-primary/5' 
                    : 'border-border hover:border-accent/50'
                }`}
              >
                {feature.isNew && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white text-[10px] px-2 py-0.5 border-0">
                    NEW
                  </Badge>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    feature.isNew ? 'bg-primary/10' : 'bg-accent/10'
                  }`}>
                    <feature.icon className={`w-5 h-5 ${feature.isNew ? 'text-primary' : 'text-accent'}`} />
                  </div>
                  <span className={`text-2xl font-bold ${feature.isNew ? 'text-primary' : 'text-accent'}`}>
                    {feature.stat}
                  </span>
                </div>
                <h3 className="text-base font-display font-bold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right - Email Preview */}
          <div className="bg-background rounded-3xl border border-border p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-warning/60" />
                <span className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-sm text-muted-foreground">Email Campaign Builder</span>
            </div>

            {/* Mock Email */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">To:</span>
                <span className="text-sm text-foreground font-medium">lead@company.com</span>
              </div>
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">Subject:</span>
                <span className="text-sm text-foreground font-medium">Quick question about your website</span>
              </div>
              <div className="py-4 space-y-3">
                <p className="text-sm text-foreground">Hi {"{{first_name}}"},</p>
                <p className="text-sm text-muted-foreground">
                  I noticed your website could use some improvements to help you get more customers...
                </p>
                <p className="text-sm text-muted-foreground">
                  Would you be open to a quick call to discuss?
                </p>
              </div>

              {/* Template Categories */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">Template Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {templateCategories.map((cat, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/pricing">
            <Button size="lg" className="rounded-full px-8 gap-2">
              <Send className="w-4 h-4" />
              Start sending emails
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EmailOutreachSection;
