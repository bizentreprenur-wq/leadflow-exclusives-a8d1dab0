import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Search, Users, Mail, Phone, BarChart3, Workflow, 
  Download, Lightbulb, Building2, Target, Shield, Zap,
  Brain, TrendingUp, Clock, RefreshCw, AlertTriangle,
  Globe, Sparkles, CheckCircle2, ArrowRight, Cpu,
  LineChart, Bell, MessageSquare, Activity, Database,
  Briefcase, DollarSign, Lock, Heart, Factory
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const coreFeatures = [
  { icon: Search, text: "AI-powered lead discovery" },
  { icon: Users, text: "Decision-maker identification" },
  { icon: Shield, text: "Contact data verification and enrichment" },
  { icon: Mail, text: "Multi-channel outreach (Email, SMS, Calls)" },
  { icon: BarChart3, text: "Built-in CRM and sales pipeline management" },
  { icon: Workflow, text: "Automated sequences and workflow management" },
  { icon: Download, text: "Export and integration options" },
  { icon: Lightbulb, text: "Real-time prospect insights" },
];

const whyUseSearch = [
  {
    icon: Brain,
    title: "Deep, AI-Driven Lead Insights",
    description: "Automatically gather rich profiles of companies and contacts — including website health, online visibility, reviews, engagement metrics, and other signals that matter for conversion. AI enrichment saves manual research time and gives contextual intelligence, not just raw lists of names or email addresses."
  },
  {
    icon: Target,
    title: "Competitive Intelligence & Market Signals",
    description: "Understand not just the target lead, but how they compare with competitors — tech stack, funding events, hiring trends, partnerships, etc. This helps craft smarter outreach and offers that resonate with prospects."
  },
  {
    icon: TrendingUp,
    title: "Prioritization with Lead Scoring",
    description: "AI can score leads automatically based on likelihood to convert — so your team focuses first on the most promising opportunities. Hot, Warm, and Cold classifications guide your sales strategy."
  },
  {
    icon: Clock,
    title: "Time + Cost Savings",
    description: "Traditional lead research is time-consuming and expensive; AI can reduce effort drastically by pulling in data from many sources at once, eliminating hours of manual prospecting."
  },
  {
    icon: RefreshCw,
    title: "Enrichment Throughout the Sales Cycle",
    description: "Beyond just lead lists, you get: Predictive insights and growth signals, review & reputation trends, website health and UX indicators, market activity and news, intent signals (e.g., funding or hiring spikes)."
  },
  {
    icon: Database,
    title: "Accurate & Up-to-Date Data",
    description: "AI tools pull real-time or frequently updated info — better than static databases that quickly go stale. Always work with the freshest business intelligence."
  },
  {
    icon: AlertTriangle,
    title: "Reduced Manual Errors",
    description: "Automation decreases the risk of outdated/out-of-scope data and improves the quality of outreach. No more embarrassing emails to closed businesses."
  },
  {
    icon: Globe,
    title: "Integration with Your Sales Stack",
    description: "Systems plug into CRMs, marketing tools, email platforms, etc., streamlining workflows and enabling one-click actions from insight to engagement."
  },
];

const additionalValueProps = [
  { icon: Activity, text: "Behavioral & Intent Signals — find prospects actively looking for solutions" },
  { icon: Cpu, text: "Technographic Insights — know what tech tools a lead already uses" },
  { icon: MessageSquare, text: "Natural Language Search — 'Find SaaS startups raised Series B in last 6 months'" },
  { icon: Bell, text: "Automated Alerts & Trends — get notified when a target's situation changes" },
  { icon: Sparkles, text: "Actionable Outreach Suggestions — personalized, higher-converting messaging" },
];

const industries = [
  { 
    icon: Cpu, 
    name: "SaaS & Tech Companies",
    description: "Find high-intent prospects, score accounts likely to upgrade, support Account-Based Marketing by tracking competitive signals."
  },
  { 
    icon: Briefcase, 
    name: "B2B Services & Agencies",
    description: "Qualify leads quickly, personalize outreach with richer insights, research competitors on behalf of clients."
  },
  { 
    icon: LineChart, 
    name: "Enterprise Sales Teams",
    description: "Evaluate potential enterprise clients with deeper signals, build priority lists, improve forecast accuracy."
  },
  { 
    icon: BarChart3, 
    name: "Market Research Firms",
    description: "Track brand sentiment, online presence, and competitor movements. Produce market scans and trend reports."
  },
  { 
    icon: DollarSign, 
    name: "Financial Services & VC",
    description: "Evaluate emerging companies for investment or partnership opportunities. Monitor growth signals."
  },
  { 
    icon: Factory, 
    name: "B2B Manufacturing",
    description: "Identify potential buyers (OEMs, supply partners). Map supplier or distributor networks."
  },
  { 
    icon: Lock, 
    name: "Cybersecurity & Compliance",
    description: "Profile companies to establish compliance risk levels. Prioritize outreach to organizations with known security stacks."
  },
  { 
    icon: Heart, 
    name: "Health Tech & MedTech",
    description: "Discover healthcare providers with relevant tech signals. Score opportunity based on funding or IT investments."
  },
  { 
    icon: Building2, 
    name: "Real Estate",
    description: "Find property managers, investors, and commercial real estate leads with digital presence analysis."
  },
  { 
    icon: Target, 
    name: "Roofing & Contracting",
    description: "Identify businesses needing website upgrades, local SEO, or digital presence improvements."
  },
];

const howItHelps = [
  { 
    title: "Discover new leads", 
    description: "Search for companies and contacts that match your ideal customer profile." 
  },
  { 
    title: "Engage efficiently", 
    description: "Reach prospects via email, SMS, or calling directly from the platform." 
  },
  { 
    title: "Automate workflows", 
    description: "Use AI to schedule follow-ups and maintain consistent communication." 
  },
  { 
    title: "Manage pipelines", 
    description: "Track leads, deals, and engagement in one centralized system." 
  },
];

const WhatIsBamlead = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "description": "AI-powered lead generation and sales intelligence platform that indexes business data, decision-maker contacts, and market signals to help companies acquire new customers.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "softwareVersion": "1.0",
    "url": "https://bamlead.com"
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>What Is Bamlead? | AI-Powered Lead Generation Platform</title>
        <meta name="description" content="Bamlead is an AI-powered lead generation and sales intelligence platform designed to help businesses find, analyze, and contact potential customers." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
            Entity Definition
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            What Is <span className="text-primary">Bamlead</span>?
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bamlead is an AI-powered lead generation and sales intelligence platform designed to help 
            businesses find, analyze, and contact potential customers. The platform indexes business data, 
            decision-maker information, and market signals to enable companies to identify high-intent 
            prospects and accelerate customer acquisition.
          </p>
        </div>

        {/* Super AI Business Search Explanation */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              The Difference
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Super AI Business Search</span> Is Different
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              This isn't just about using Google to find websites. It's about <strong className="text-foreground">AI-powered analysis</strong> that transforms raw data into actionable intelligence for your sales team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {whyUseSearch.map((item, index) => (
              <Card key={index} className="border-border/50 bg-card/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Additional Value Props */}
        <section className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Additional Value Propositions</h2>
            <p className="text-muted-foreground">Extra selling points that set Bamlead apart</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalValueProps.map((prop, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{prop.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries Section */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/30">
              Industry Applications
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Industries That Benefit Most</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From SaaS to healthcare, AI-powered lead search transforms how businesses find and engage prospects
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((industry, index) => (
              <Card key={index} className="border-border/50 bg-card/50 hover:border-violet-500/30 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <industry.icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-foreground">{industry.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Core Features */}
        <section className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Core Platform Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How Bamlead Helps */}
        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How Bamlead Helps Businesses</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {howItHelps.map((item, index) => (
              <div key={index} className="p-6 rounded-2xl border border-border bg-card/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-muted-foreground pl-11">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-4xl mx-auto text-center">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Intelligence-Led Growth</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Tools like Bamlead Advance Business Search help companies move from guesswork to intelligence-led growth. 
                Instead of cold outreach based on generic lists, you get <strong className="text-foreground">data-rich, prioritized prospects</strong> that 
                shorten sales cycles, improve conversion rates, and support strategic decision-making across sales, 
                marketing, product, and executive teams.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Shorter Sales Cycles
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Higher Conversion Rates
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Strategic Decision Support
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhatIsBamlead;
