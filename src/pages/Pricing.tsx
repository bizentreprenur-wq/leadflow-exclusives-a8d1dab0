import { useState } from "react";
import { Check, X, Zap, Building, Rocket, Gift, Sparkles, MessageSquare, Search, Mail, Brain, Globe, Users, BarChart3, Shield, Workflow, FileText, Phone, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/lib/api/stripe";
import DiscountCodeInput from "@/components/DiscountCodeInput";
import FreeTrialBanner from "@/components/FreeTrialBanner";

// Feature categories for comprehensive display - 2026 AI Outcomes Model
const featureCategories = [
  {
    name: "Lead Discovery",
    icon: Search,
    features: [
      { text: "GMB (Google Maps) Search", free: "5/day", basic: "30/day", pro: "200/day", autopilot: "Unlimited", unlimited: "Unlimited" },
      { text: "Platform Search (16 platforms)", free: "3/day", basic: "30/day", pro: "200/day", autopilot: "Unlimited", unlimited: "Unlimited" },
      { text: "Super AI Business Search (Option A)", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Agency Lead Finder (Option B)", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Synonym AI Expansion (2,000+ leads)", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Reverse Lead Discovery", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "AI Intelligence",
    icon: Brain,
    features: [
      { text: "AI Lead Verification Credits", free: "25/mo", basic: "200/mo", pro: "500/mo", autopilot: "2,000/mo", unlimited: "Unlimited" },
      { text: "Niche Intelligence & Market Research", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "SWOT Analysis & Competitive Benchmarking", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Buyer Matching (Product-Fit Scoring)", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "12-Category Business Intelligence", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Digital Maturity Tags & Scoring", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "AI Lead Scoring & Classification", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Smart Response Detection", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Buyer Intent Detection", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "AI Sales Mentor", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Email Outreach",
    icon: Mail,
    features: [
      { text: "Email Extraction", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "AI Email Writer", free: "Basic", basic: "Full", pro: "Full", autopilot: "Autonomous", unlimited: "Autonomous" },
      { text: "Email Templates Library", free: false, basic: "Basic", pro: "Full", autopilot: "Full + Custom", unlimited: "Full + Custom" },
      { text: "Drip Campaigns & Sequences", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "A/B Testing", free: false, basic: false, pro: true, autopilot: "Real-time AI", unlimited: "Real-time AI" },
      { text: "Email Deliverability Tracking", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "AI Automation Level",
    icon: Sparkles,
    features: [
      { text: "Manual Mode (You Click Send)", free: true, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Co-Pilot Mode (AI Manages Sequences)", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Agentic Mode (Full Autopilot)", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Auto Follow-Up Sequences", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Lead Response Detection", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "AI Resurrection Sequences", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Autonomous Proposal Delivery", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "AI Voice Calling",
    icon: Phone,
    features: [
      { text: "AI Call Script Generation", free: "Preview", basic: true, pro: true, autopilot: "Advanced", unlimited: "Advanced" },
      { text: "Outbound AI Calling", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Phone Number Setup", free: false, basic: false, pro: "1 Number", autopilot: "Included", unlimited: "Included" },
      { text: "Call Volume", free: false, basic: false, pro: "Limited", autopilot: "Higher Limits", unlimited: "Unlimited" },
      { text: "Call Summaries & Outcomes", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Autonomous Calling Mode", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "AI Script Adaptation (Live)", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Auto Follow-Up After Calls", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Lead Qualification & Tagging", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Website Analysis",
    icon: Globe,
    features: [
      { text: "WordPress Detection", free: true, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "CMS & Tech Stack Detection", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Website Quality Scoring", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "SEO Health Analysis", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Dynamic Sequences (LinkedIn/News)", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Social & Contact Discovery",
    icon: Users,
    features: [
      { text: "Social Media Lookup (5 platforms)", free: true, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Decision-Maker Identification", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "LinkedIn Profile Finder", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Phone Number Extraction", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "CRM & Integrations",
    icon: Workflow,
    features: [
      { text: "CSV Export", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "BamLead CRM", free: false, basic: "14-day trial", pro: true, autopilot: true, unlimited: true },
      { text: "External CRM Integrations", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Google Calendar Sync", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "Google Drive Export", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "API Access", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Webhooks", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Analytics & Reports",
    icon: BarChart3,
    features: [
      { text: "Campaign Performance Dashboard", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Lead Intelligence Reports", free: false, basic: true, pro: true, autopilot: true, unlimited: true },
      { text: "Email Analytics", free: false, basic: "Basic", pro: "Advanced", autopilot: "Full", unlimited: "Full" },
      { text: "Conversion Funnel Tracking", free: false, basic: false, pro: true, autopilot: true, unlimited: true },
      { text: "White-Label Reports", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "AI Weekly Performance Summaries", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Dedicated AI Sales Brain",
    icon: Brain,
    features: [
      { text: "Custom-Trained AI on Your Niche", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Learns Objection Handling Over Time", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Custom Call Scripts Per Industry", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Memory Across All Conversations", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Managed Services (Done-For-You)",
    icon: Rocket,
    features: [
      { text: "Full Campaign Buildout", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "ICP Targeting Setup", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Niche Research Done For You", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Custom Proposal Templates", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "CRM Integration Setup", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
      { text: "Calendar Integration Setup", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
  {
    name: "Team & Support",
    icon: Shield,
    features: [
      { text: "Team Members", free: "1", basic: "1", pro: "3", autopilot: "Unlimited", unlimited: "Unlimited" },
      { text: "Support", free: "Community", basic: "Email", pro: "Priority", autopilot: "Dedicated Manager", unlimited: "Dedicated Manager" },
      { text: "Exclusive Territories", free: false, basic: false, pro: false, autopilot: "3 included", unlimited: "Unlimited" },
      { text: "Custom Branding", free: false, basic: false, pro: false, autopilot: true, unlimited: true },
    ],
  },
];

const tiers = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Try it out and see real results",
    icon: Gift,
    aiLevel: "Explorer",
    highlights: [
      "5 GMB searches per day",
      "3 Platform searches per day",
      "25 AI verification credits",
      "Social media lookup",
      "AI call script preview only",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    yearlyPrice: 470,
    description: "AI assists with writing — you click 'Send'",
    icon: Zap,
    aiLevel: "Manual Mode",
    highlights: [
      "30 searches per day",
      "200 AI verification credits/month",
      "12-Category Business Intelligence",
      "AI Email Writer (you control)",
      "AI generates call scripts (you dial)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    yearlyPrice: 950,
    description: "AI manages sequences — you jump in to close",
    icon: Building,
    popular: true,
    aiLevel: "Co-Pilot Mode",
    highlights: [
      "200 searches per day",
      "500 AI verification credits/month",
      "Smart Response Detection",
      "Auto Follow-Up Sequences",
      "AI calls your leads (you supervise)",
      "1 phone number required",
    ],
  },
  {
    id: "autopilot",
    name: "Autopilot",
    monthlyPrice: 249,
    yearlyPrice: 2390,
    description: "AI handles everything — Discovery → Nurture → Proposal",
    icon: Rocket,
    aiLevel: "Agentic Mode",
    highlights: [
      "Unlimited searches",
      "2,000 AI verification credits",
      "Dedicated AI Sales Brain (Custom Model)",
      "Fully Autonomous AI Calling",
      "Full campaign buildout & ICP setup",
      "CRM + Calendar integration setup",
      "Custom proposal templates",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    description: "Dedicated agent sets up everything — you just close deals",
    icon: Crown,
    aiLevel: "Fully Managed",
    highlights: [
      "Unlimited everything — no credits needed",
      "Dedicated AI Sales Brain (Custom Model)",
      "Dedicated agent guides your full setup",
      "Full campaign buildout & ICP targeting",
      "Niche research done for you",
      "Custom proposal templates built for you",
      "CRM + Calendar integration setup",
    ],
  },
];

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Show message if redirected from payment
  const paymentStatus = searchParams.get('payment');
  if (paymentStatus === 'canceled') {
    toast.info('Payment was canceled');
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      navigate('/auth');
      return;
    }

    if (!isAuthenticated) {
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      toast.info('Please sign in first to subscribe');
      navigate(`/auth?plan=${planId}&billing=${billingPeriod}`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const { checkout_url } = await createCheckoutSession(
        planId as 'basic' | 'pro' | 'autopilot' | 'unlimited',
        isYearly ? 'yearly' : 'monthly'
      );
      window.location.href = checkout_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const yearlySavings = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  // Helper to render feature values in comparison table
  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-primary mx-auto" />;
    }
    if (value === false) {
      return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
    }
    return <span className="text-foreground text-sm font-medium">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Back Button */}
        <div className="container px-4 pt-6">
          <BackButton />
        </div>

        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Simple Pricing
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Choose Your Plan
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                No contracts. No hidden fees. Cancel anytime. Start finding qualified leads today.
              </p>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-4">
                <Label htmlFor="billing-toggle" className={!isYearly ? 'font-medium' : 'text-muted-foreground'}>
                  Monthly
                </Label>
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                <Label htmlFor="billing-toggle" className={isYearly ? 'font-medium' : 'text-muted-foreground'}>
                  Yearly
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                    Save 20%
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </section>

        {/* AI Verification Banner */}
        <section className="pb-8">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="w-10 h-10 text-amber-500" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                      AI-Powered Lead Verification Included
                    </h3>
                    <p className="text-muted-foreground max-w-2xl">
                      Unlike most competitors, every plan includes <span className="text-foreground font-medium">AI verification credits</span> to validate emails, score leads, and generate personalized outreach. 
                      Get more accurate leads and higher conversion rates for your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Trial Banner */}
        <section className="pb-12">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <FreeTrialBanner />
            </div>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                {tiers.map((tier) => {
                  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
                  const savings = yearlySavings(tier.monthlyPrice, tier.yearlyPrice);

                  const isAutopilot = tier.id === 'autopilot';
                  const isUnlimited = tier.id === 'unlimited';
                  
                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-2xl border ${
                        isUnlimited
                          ? "border-red-500/50 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] bg-card"
                          : isAutopilot
                          ? "border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] bg-card"
                          : tier.popular
                          ? "border-primary shadow-elevated bg-card"
                          : "border-border bg-card/80"
                      } p-8 flex flex-col`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            Most Popular
                          </span>
                        </div>
                      )}
                      {isAutopilot && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium whitespace-nowrap">
                            AI Does Everything
                          </span>
                        </div>
                      )}
                      {isUnlimited && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium whitespace-nowrap">
                            AI Does Everything
                          </span>
                        </div>
                      )}

                      {/* AI Level Badge */}
                      {tier.aiLevel && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4 w-fit ${
                          isUnlimited
                            ? 'bg-red-500/10 text-red-500'
                            : isAutopilot 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : tier.popular 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          {tier.aiLevel}
                        </div>
                      )}

                      {/* Icon and name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${isUnlimited ? 'bg-red-500/10' : isAutopilot ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                          <tier.icon className={`w-6 h-6 ${isUnlimited ? 'text-red-500' : isAutopilot ? 'text-amber-500' : 'text-primary'}`} />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-foreground">
                          {tier.name}
                        </h3>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {price === 0 ? (
                          <span className="text-4xl font-bold text-foreground">Free</span>
                        ) : (
                          <>
                            <span className={`text-4xl font-bold ${isUnlimited ? 'text-red-500' : isAutopilot ? 'text-amber-500' : 'text-foreground'}`}>${price}</span>
                            <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                            {isYearly && savings > 0 && (
                              <div className={`mt-1 text-sm ${isUnlimited ? 'text-red-500' : isAutopilot ? 'text-amber-500' : 'text-primary'}`}>
                                Save {savings}% vs monthly
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground mb-6">{tier.description}</p>

                      {/* CTA */}
                      <Button
                        variant={tier.popular ? "default" : "outline"}
                        className={`w-full mb-8 ${
                          isUnlimited 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0' 
                            : isAutopilot 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0' 
                            : ''
                        }`}
                        size="lg"
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={loadingPlan === tier.id}
                      >
                        {loadingPlan === tier.id ? 'Loading...' : tier.id === 'free' ? 'Get Started' : tier.id === 'unlimited' ? 'Get Unlimited' : tier.id === 'autopilot' ? 'Go Autopilot' : 'Subscribe'}
                      </Button>

                      {/* Key Highlights */}
                      <div className="space-y-3 flex-1">
                        {tier.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isUnlimited ? 'text-red-500' : isAutopilot ? 'text-amber-500' : 'text-primary'}`} />
                            <span className="text-foreground text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Full Feature Comparison Table */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Everything Included in Bamlead
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Niche Intelligence, SWOT Analysis, Buyer Matching, Synonym AI Expansion, Agency Lead Finder, AI Autopilot & 50+ more features across every plan.
                </p>
              </div>

              {/* Feature Categories */}
              <div className="space-y-8">
                {featureCategories.map((category) => (
                  <div key={category.name} className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 border-b border-border">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {category.name}
                      </h3>
                    </div>

                    {/* Feature Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4 text-muted-foreground font-medium min-w-[200px]">Feature</th>
                            <th className="text-center p-4 text-muted-foreground font-medium w-24">Free</th>
                            <th className="text-center p-4 text-muted-foreground font-medium w-24">Basic</th>
                            <th className="text-center p-4 text-primary font-medium w-24 bg-primary/5">Pro</th>
                            <th className="text-center p-4 text-amber-500 font-medium w-24 bg-amber-500/5">Autopilot</th>
                            <th className="text-center p-4 text-red-500 font-medium w-24 bg-red-500/5">Unlimited</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.features.map((feature, idx) => (
                            <tr key={idx} className="border-b border-border/50 last:border-0">
                              <td className="p-4 text-foreground text-sm">{feature.text}</td>
                              <td className="p-4 text-center">
                                {renderFeatureValue(feature.free)}
                              </td>
                              <td className="p-4 text-center">
                                {renderFeatureValue(feature.basic)}
                              </td>
                              <td className="p-4 text-center bg-primary/5">
                                {renderFeatureValue(feature.pro)}
                              </td>
                              <td className="p-4 text-center bg-amber-500/5">
                                {renderFeatureValue(feature.autopilot)}
                              </td>
                              <td className="p-4 text-center bg-red-500/5">
                                {renderFeatureValue((feature as any).unlimited)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Calling Explainer */}
              <div className="mt-12 space-y-6">
                <div className="text-center mb-8">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">AI Calling by Plan</h3>
                  <p className="text-muted-foreground">How AI calling works at each level</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Free - No AI Calling */}
                  <div className="p-5 rounded-2xl border border-border bg-card/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="font-semibold text-foreground">Free</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      AI script preview only. No calling.
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                      <span>Upgrade to enable</span>
                    </div>
                  </div>

                  {/* Basic - Scripts Only */}
                  <div className="p-5 rounded-2xl border border-border bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">Basic</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      AI prepares your call script. You make the call.
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>AI-generated scripts</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <X className="w-3.5 h-3.5" />
                        <span>No outbound AI calling</span>
                      </div>
                    </div>
                  </div>

                  {/* Pro - AI Calls, You Supervise */}
                  <div className="p-5 rounded-2xl border-2 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">Pro</span>
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      AI calls your leads using a dedicated business number.
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>Outbound AI calling</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>1 phone number (own or $8/mo)</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>Call summaries & outcomes</span>
                      </div>
                    </div>
                  </div>

                  {/* Autopilot - Fully Autonomous */}
                  <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-amber-500/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Phone className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="font-semibold text-foreground">Autopilot</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      AI handles calls from first contact to booked conversation.
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>Automatic outbound calling</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>Phone number included</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI adapts scripts live</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lead qualification + tagging</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Number Pricing Note */}
                <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Phone Number Options:</span> Use your own number (verified via API) or get a BamLead-provided number for <span className="text-primary font-medium">$8/month</span>. 
                    Autopilot plan includes one phone number at no extra cost.
                  </p>
                </div>

                {/* Note about Autopilot being included */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">AI Autopilot</span> (autonomous email sequences, follow-ups, and proposal delivery) 
                      is <span className="text-amber-500 font-medium">included</span> in Pro and Autopilot plans — no add-on needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discount Code Section */}
        <section className="pb-12">
          <div className="container px-4">
            <div className="max-w-md mx-auto p-6 rounded-2xl border border-border bg-card">
              <DiscountCodeInput />
            </div>
          </div>
        </section>

        {/* FAQ teaser */}
        <section className="pb-20 md:pb-28">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="p-8 rounded-2xl border border-border bg-secondary/30">
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Questions?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Not sure which plan is right for you? Start with a free search and see the quality of leads for yourself.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/">
                    <Button size="lg">Try a Free Search</Button>
                  </Link>
                  <Link to="/reviews">
                    <Button size="lg" variant="outline" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Read Reviews
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button size="lg" variant="outline">Contact Sales</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
