import { useState } from "react";
import { Check, X, Zap, Building, Rocket, Gift, Sparkles, MessageSquare, Search, Mail, Brain, Globe, Users, BarChart3, Shield, Workflow, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Feature categories for comprehensive display
const featureCategories = [
  {
    name: "Lead Discovery",
    icon: Search,
    features: [
      { text: "GMB (Google Maps) Search", free: "5/day", basic: "50/day", pro: "200/day", agency: "Unlimited" },
      { text: "Platform Search (16 platforms)", free: "3/day", basic: "50/day", pro: "200/day", agency: "Unlimited" },
      { text: "Super AI Business Search", free: false, basic: true, pro: true, agency: true },
      { text: "Reverse Lead Discovery", free: false, basic: false, pro: true, agency: true },
    ],
  },
  {
    name: "AI Intelligence",
    icon: Brain,
    features: [
      { text: "AI Lead Verification Credits", free: "25/mo", basic: "200/mo", pro: "500/mo", agency: "2,000/mo" },
      { text: "11-Category Business Intelligence", free: false, basic: true, pro: true, agency: true },
      { text: "AI Lead Scoring & Classification", free: false, basic: true, pro: true, agency: true },
      { text: "Competitor Analysis", free: false, basic: false, pro: true, agency: true },
      { text: "Buyer Intent Detection", free: false, basic: false, pro: true, agency: true },
      { text: "AI Sales Mentor", free: false, basic: false, pro: true, agency: true },
    ],
  },
  {
    name: "Email Outreach",
    icon: Mail,
    features: [
      { text: "Email Extraction", free: false, basic: true, pro: true, agency: true },
      { text: "AI Email Writer", free: false, basic: true, pro: true, agency: true },
      { text: "Email Templates Library", free: false, basic: "Basic", pro: "Full", agency: "Full + Custom" },
      { text: "Drip Campaigns & Sequences", free: false, basic: false, pro: true, agency: true },
      { text: "A/B Testing", free: false, basic: false, pro: true, agency: true },
      { text: "Email Deliverability Tracking", free: false, basic: false, pro: true, agency: true },
    ],
  },
  {
    name: "Website Analysis",
    icon: Globe,
    features: [
      { text: "WordPress Detection", free: true, basic: true, pro: true, agency: true },
      { text: "CMS & Tech Stack Detection", free: false, basic: true, pro: true, agency: true },
      { text: "Website Quality Scoring", free: false, basic: false, pro: true, agency: true },
      { text: "SEO Health Analysis", free: false, basic: false, pro: true, agency: true },
      { text: "Mobile Responsiveness Check", free: false, basic: false, pro: true, agency: true },
    ],
  },
  {
    name: "Social & Contact Discovery",
    icon: Users,
    features: [
      { text: "Social Media Lookup (5 platforms)", free: true, basic: true, pro: true, agency: true },
      { text: "Decision-Maker Identification", free: false, basic: false, pro: true, agency: true },
      { text: "LinkedIn Profile Finder", free: false, basic: false, pro: true, agency: true },
      { text: "Phone Number Extraction", free: false, basic: true, pro: true, agency: true },
    ],
  },
  {
    name: "CRM & Integrations",
    icon: Workflow,
    features: [
      { text: "CSV Export", free: false, basic: true, pro: true, agency: true },
      { text: "BamLead CRM (14-day trial)", free: false, basic: true, pro: true, agency: true },
      { text: "External CRM Integrations", free: false, basic: false, pro: true, agency: true },
      { text: "Google Calendar Sync", free: false, basic: false, pro: true, agency: true },
      { text: "Google Drive Export", free: false, basic: false, pro: true, agency: true },
      { text: "API Access", free: false, basic: false, pro: false, agency: true },
      { text: "Webhooks", free: false, basic: false, pro: false, agency: true },
    ],
  },
  {
    name: "Automation",
    icon: Sparkles,
    features: [
      { text: "AI Autopilot Campaign*", free: false, basic: true, pro: true, agency: true },
      { text: "Auto Follow-Up Sequences", free: false, basic: false, pro: true, agency: true },
      { text: "Smart Scheduling Engine", free: false, basic: false, pro: true, agency: true },
      { text: "Lead Response Detection", free: false, basic: false, pro: true, agency: true },
    ],
  },
  {
    name: "Analytics & Reports",
    icon: BarChart3,
    features: [
      { text: "Campaign Performance Dashboard", free: false, basic: true, pro: true, agency: true },
      { text: "Lead Intelligence Reports", free: false, basic: true, pro: true, agency: true },
      { text: "Email Analytics", free: false, basic: "Basic", pro: "Advanced", agency: "Full" },
      { text: "Conversion Funnel Tracking", free: false, basic: false, pro: true, agency: true },
      { text: "White-Label Reports", free: false, basic: false, pro: false, agency: true },
    ],
  },
  {
    name: "Team & Support",
    icon: Shield,
    features: [
      { text: "Team Members", free: "1", basic: "1", pro: "3", agency: "Unlimited" },
      { text: "Support", free: "Community", basic: "Email", pro: "Priority", agency: "Dedicated Manager" },
      { text: "Exclusive Territories", free: false, basic: false, pro: false, agency: "3 included" },
      { text: "Custom Branding", free: false, basic: false, pro: false, agency: true },
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
    highlights: [
      "5 GMB searches per day",
      "3 Platform searches per day",
      "25 AI verification credits",
      "Social media lookup",
      "WordPress detection",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    yearlyPrice: 470,
    description: "Perfect for freelancers getting started",
    icon: Zap,
    highlights: [
      "50 searches per day",
      "200 AI verification credits/month",
      "Super AI Business Intelligence",
      "Email extraction & AI writer",
      "CSV export & CRM trial",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    yearlyPrice: 950,
    description: "For professionals who want more leads",
    icon: Building,
    popular: true,
    highlights: [
      "200 searches per day",
      "500 AI verification credits/month",
      "Full email outreach suite",
      "CRM integrations & automation",
      "Team collaboration (3 users)",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 249,
    yearlyPrice: 2390,
    description: "For teams and agencies at scale",
    icon: Rocket,
    highlights: [
      "Unlimited searches",
      "2,000 AI verification credits",
      "API access + webhooks",
      "White-label everything",
      "Dedicated account manager",
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
      // Redirect to signup (client-side navigation)
      navigate('/auth');
      return;
    }

    if (!isAuthenticated) {
      // Pass plan info so we can redirect to checkout after login
      const billingPeriod = isYearly ? 'yearly' : 'monthly';
      toast.info('Please sign in first to subscribe');
      navigate(`/auth?plan=${planId}&billing=${billingPeriod}`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const { checkout_url } = await createCheckoutSession(
        planId as 'basic' | 'pro' | 'agency',
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
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tiers.map((tier) => {
                  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
                  const savings = yearlySavings(tier.monthlyPrice, tier.yearlyPrice);

                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-2xl border ${
                        tier.popular
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

                      {/* Icon and name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                          <tier.icon className="w-6 h-6 text-primary" />
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
                            <span className="text-4xl font-bold text-foreground">${price}</span>
                            <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                            {isYearly && savings > 0 && (
                              <div className="mt-1 text-sm text-primary">
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
                        className="w-full mb-8"
                        size="lg"
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={loadingPlan === tier.id}
                      >
                        {loadingPlan === tier.id ? 'Loading...' : tier.id === 'free' ? 'Get Started' : 'Subscribe'}
                      </Button>

                      {/* Key Highlights */}
                      <div className="space-y-3 flex-1">
                        {tier.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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
                  Compare all features across plans. Bamlead is a complete lead generation platform with 50+ features.
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
                            <th className="text-center p-4 text-muted-foreground font-medium w-24">Agency</th>
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
                              <td className="p-4 text-center">
                                {renderFeatureValue(feature.agency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add-on Note */}
              <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">* AI Autopilot Campaign</h4>
                    <p className="text-muted-foreground text-sm">
                      Available as an add-on for $19.99/month with a 7-day free trial. Includes automated lead discovery, 
                      AI-powered outreach sequences, and intelligent follow-ups. All paid plans have access to this premium feature.
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
