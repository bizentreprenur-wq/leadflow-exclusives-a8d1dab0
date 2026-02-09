import { Palette, Share2, Megaphone, Globe, TrendingUp, Target, Building2, Briefcase, LineChart, Smartphone, Code, Users, DollarSign, Rocket, Brain, Database, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Super AI Business Search Professionals
const searchAProfessionals = [
  { icon: Megaphone, text: "Marketing & Digital Agencies", highlight: true },
  { icon: Search, text: "SEO & Local SEO Specialists", highlight: true },
  { icon: Globe, text: "Google/Facebook Ads Managers", highlight: true },
  { icon: Palette, text: "Website Design Agencies" },
  { icon: Code, text: "Web Developers" },
  { icon: TrendingUp, text: "Growth Hackers" },
  { icon: LineChart, text: "SaaS Growth Teams" },
  { icon: Users, text: "B2B Sales Teams" },
  { icon: Database, text: "Data Enrichment Companies" },
  { icon: Brain, text: "Business Intelligence Analysts" },
  { icon: DollarSign, text: "Private Equity Analysts" },
  { icon: Building2, text: "Venture Capital Analysts" },
  { icon: Briefcase, text: "Franchise Developers" },
  { icon: Target, text: "Market Research Firms" },
  { icon: Rocket, text: "Startup Founders" },
  { icon: Share2, text: "Compliance Consultants" },
];

// Agency Lead Finder Professionals
const searchBProfessionals = [
  { icon: Palette, text: "Website Design Agencies", highlight: true },
  { icon: Share2, text: "SMMA Owners", highlight: true },
  { icon: Smartphone, text: "Freelance Web Designers", highlight: true },
  { icon: Megaphone, text: "Cold Email Agencies" },
  { icon: Users, text: "Lead Generation Agencies" },
  { icon: Code, text: "Funnel Builders" },
  { icon: Globe, text: "SEO Freelancers" },
  { icon: TrendingUp, text: "Marketing Consultants" },
  { icon: Brain, text: "AI Automation Agencies" },
  { icon: Building2, text: "Chatbot Agencies" },
  { icon: Target, text: "Email Marketing Agencies" },
  { icon: Briefcase, text: "Virtual Assistant Agencies" },
  { icon: DollarSign, text: "Solar Sales Agencies" },
  { icon: Rocket, text: "Dental Marketing Agencies" },
  { icon: LineChart, text: "HVAC Marketers" },
  { icon: Database, text: "Insurance Lead Agencies" },
];

const WhoThisIsForSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Who This Is For
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Built for intelligence-driven professionals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Two powerful modes: research your market with niche intelligence & SWOT analysis, or find service clients with AI-powered lead discovery. Both include AI email, voice calling, and autopilot outreach.
            </p>
          </div>

          {/* Tabs for Search A vs Search B */}
          <Tabs defaultValue="search-a" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="search-a" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                🧠 Super AI Business Search
              </TabsTrigger>
              <TabsTrigger value="search-b" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                🎯 Agency Lead Finder
              </TabsTrigger>
            </TabsList>

            {/* Search A Content */}
            <TabsContent value="search-a">
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Super AI Business Search</h3>
                <p className="text-sm font-semibold text-primary mb-1">Market Intelligence · SWOT · Buyer Matching</p>
                <p className="text-sm text-muted-foreground">Niche research, competitive analysis, and AI-driven buyer identification for B2B professionals</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {searchAProfessionals.map((audience, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                      audience.highlight 
                        ? 'border-primary/50 bg-primary/5 hover:border-primary hover:shadow-lg hover:shadow-primary/10' 
                        : 'border-border bg-card/50 hover:border-primary/30'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                      audience.highlight ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <audience.icon className={`w-4 h-4 ${audience.highlight ? 'text-primary' : 'text-primary/80'}`} />
                    </div>
                    <p className={`text-sm font-medium ${audience.highlight ? 'text-foreground' : 'text-foreground/80'}`}>
                      {audience.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-center p-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-500/5">
                <p className="text-lg font-semibold text-foreground mb-1">
                  Niche Intelligence • SWOT • Buyer Matching • 2,000+ Leads
                </p>
                <p className="text-sm text-muted-foreground">
                  Digital maturity scoring, market patterns, competitive gaps, and AI-powered outreach via email, voice & autopilot
                </p>
              </div>
            </TabsContent>

            {/* Search B Content */}
            <TabsContent value="search-b">
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Agency Lead Finder</h3>
                <p className="text-sm font-semibold text-violet-400 mb-1">SSE Streaming · Smart Synonym Search · Contact Discovery</p>
                <p className="text-sm text-muted-foreground">Real-time progressive lead delivery with emails, phones, and website audits for service agencies</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {searchBProfessionals.map((audience, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                      audience.highlight 
                        ? 'border-violet-500/50 bg-violet-500/5 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10' 
                        : 'border-border bg-card/50 hover:border-violet-500/30'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                      audience.highlight ? 'bg-violet-500/20' : 'bg-violet-500/10'
                    }`}>
                      <audience.icon className={`w-4 h-4 ${audience.highlight ? 'text-violet-400' : 'text-violet-400/80'}`} />
                    </div>
                    <p className={`text-sm font-medium ${audience.highlight ? 'text-foreground' : 'text-foreground/80'}`}>
                      {audience.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-center p-6 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
                <p className="text-lg font-semibold text-foreground mb-1">
                  Stop Cold Calling. Start Closing.
                </p>
                <p className="text-sm text-muted-foreground">
                  Find businesses with broken websites, weak presence, and visible problems—clients who need exactly what you offer
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default WhoThisIsForSection;
