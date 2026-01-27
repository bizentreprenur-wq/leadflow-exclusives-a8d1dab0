import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Globe, X, ArrowRight, CheckCircle2, 
  Brain, Users, Palette, TrendingUp, Search, Database
} from "lucide-react";

interface SearchTypeOnboardingProps {
  onClose: () => void;
}

const SearchTypeOnboarding = ({ onClose }: SearchTypeOnboardingProps) => {
  const [selectedView, setSelectedView] = useState<"overview" | "optionA" | "optionB">("overview");

  // Track view count in localStorage
  useEffect(() => {
    const viewCount = parseInt(localStorage.getItem('bamlead_search_onboarding_views') || '0', 10);
    localStorage.setItem('bamlead_search_onboarding_views', String(viewCount + 1));
  }, []);

  const handleClose = () => {
    onClose();
  };

  const optionAFeatures = [
    "Deep research across 10 AI intelligence categories",
    "100+ data points analyzed per business",
    "Competitive intelligence & market signals",
    "Website health, tech stack & compliance analysis",
    "Buying intent signals & sales readiness scoring",
    "Full research export: PDF, Excel, Google Drive"
  ];

  const optionAFor = [
    "SaaS companies targeting specific industries",
    "B2B sales teams doing account research",
    "Investors analyzing market opportunities",
    "Agencies doing competitive intelligence",
    "Consultants researching client markets"
  ];

  const optionBFeatures = [
    "Find businesses with broken or outdated websites",
    "Detect weak social media presence & missing reviews",
    "Identify businesses needing digital marketing help",
    "Real-time analysis of tracking pixels & conversion gaps",
    "Export client-ready reports for pitches"
  ];

  const optionBFor = [
    "Website designers & web development agencies",
    "Social media marketing agencies (SMMA)",
    "SEO professionals & digital marketers",
    "Freelance designers & marketing consultants",
    "Cold email & appointment setting agencies"
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="p-8 pb-4 text-center border-b border-border bg-gradient-to-b from-secondary/50 to-transparent">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Search className="h-3 w-3 mr-1" />
            Choose Your Search Method
          </Badge>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Two Powerful Ways to Find Leads
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the search method that matches your business goals
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {selectedView === "overview" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Option A Card */}
              <div 
                className="group bg-card rounded-2xl border-2 border-primary/30 p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                onClick={() => setSelectedView("optionA")}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">🧠 Super AI Business Search</h3>
                    <p className="text-xs text-primary font-medium">Research & Intelligence</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Get comprehensive AI-powered insights on any business or niche. Perfect for understanding markets, analyzing competitors, and finding high-intent prospects.
                </p>

                <div className="space-y-2 mb-4">
                  {["Deep business intelligence", "Market research", "Competitor analysis", "Niche insights"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">Best For:</p>
                  <p className="text-xs text-muted-foreground">
                    SaaS, investors, B2B sales, agencies doing research
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-primary/30 hover:bg-primary/10 hover:border-primary group-hover:border-primary"
                >
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Option B Card */}
              <div 
                className="group bg-card rounded-2xl border-2 border-violet-500/30 p-6 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer"
                onClick={() => setSelectedView("optionB")}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">🎯 Agency Lead Finder</h3>
                    <p className="text-xs text-violet-400 font-medium">Find Your Clients</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Discover businesses that need your digital services. Find clients with broken websites, weak social presence, or missing marketing — ready for your help.
                </p>

                <div className="space-y-2 mb-4">
                  {["Find clients who need you", "Website quality detection", "Digital presence gaps", "Service opportunity finder"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <p className="text-xs font-semibold text-violet-400 mb-1">Best For:</p>
                  <p className="text-xs text-muted-foreground">
                    Web designers, SMMA, SEO pros, marketing agencies
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500 group-hover:border-violet-500"
                >
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Option A Detail View */}
          {selectedView === "optionA" && (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedView("overview")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to overview
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">🧠 Super AI Business Search</h3>
                  <p className="text-primary font-medium">Advanced Business Insights Beyond Basic Lead Lists</p>
                </div>
              </div>

              <p className="text-muted-foreground">
                This isn't just a lead list — it's a comprehensive business intelligence platform. Get deep insights on any business or niche to help you understand markets, identify opportunities, and craft personalized outreach.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    What You Get
                  </h4>
                  <div className="space-y-2">
                    {optionAFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Perfect For
                  </h4>
                  <div className="space-y-2">
                    {optionAFor.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Option B Detail View */}
          {selectedView === "optionB" && (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedView("overview")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to overview
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground">🎯 Agency Lead Finder</h3>
                  <p className="text-violet-400 font-medium">Find Clients Who Need Your Services</p>
                </div>
              </div>

              <p className="text-muted-foreground">
                Built specifically for digital professionals. Find businesses that actually need your services — those with outdated websites, weak online presence, or missing digital marketing. Stop cold outreach and start warm conversations.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    What You Get
                  </h4>
                  <div className="space-y-2">
                    {optionBFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    Perfect For
                  </h4>
                  <div className="space-y-2">
                    {optionBFor.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            You can access this guide anytime from your dashboard
          </p>
          <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
            Got it, let's start <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to check if onboarding should show
export const shouldShowSearchOnboarding = (): boolean => {
  const viewCount = parseInt(localStorage.getItem('bamlead_search_onboarding_views') || '0', 10);
  return viewCount < 2;
};

// Helper to reset (for testing or accessing again)
export const resetSearchOnboarding = () => {
  localStorage.removeItem('bamlead_search_onboarding_views');
};

export default SearchTypeOnboarding;
