import { useState } from "react";
import { Check, X, Zap, Building, Rocket, Gift, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession } from "@/lib/api/stripe";
import DiscountCodeInput from "@/components/DiscountCodeInput";
import FreeTrialBanner from "@/components/FreeTrialBanner";

const tiers = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Try it out and see real results",
    icon: Gift,
    verificationCredits: 25,
    features: [
      { text: "5 GMB searches per day", included: true },
      { text: "3 Platform searches per day", included: true },
      { text: "25 AI verification credits/month", included: true, highlight: true },
      { text: "Basic lead info (name, phone, website)", included: true },
      { text: "WordPress detection", included: true },
      { text: "Community support", included: true },
      { text: "Email extraction", included: false },
      { text: "Priority platform detection", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    yearlyPrice: 470,
    description: "Perfect for freelancers getting started",
    icon: Zap,
    verificationCredits: 200,
    features: [
      { text: "50 searches per day", included: true },
      { text: "200 AI verification credits/month", included: true, highlight: true },
      { text: "Basic lead verification", included: true },
      { text: "CSV export", included: true },
      { text: "WordPress detection", included: true },
      { text: "Email support", included: true },
      { text: "Priority platform detection", included: false },
      { text: "Exclusive territories", included: false },
      { text: "API access", included: false },
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
    verificationCredits: 500,
    features: [
      { text: "200 searches per day", included: true },
      { text: "500 AI verification credits/month", included: true, highlight: true },
      { text: "Advanced lead verification", included: true },
      { text: "CRM integrations", included: true },
      { text: "All 16 platform detections", included: true },
      { text: "Priority support", included: true },
      { text: "Team collaboration (3 users)", included: true },
      { text: "Website quality scoring", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 249,
    yearlyPrice: 2390,
    description: "For teams and agencies at scale",
    icon: Rocket,
    verificationCredits: 2000,
    features: [
      { text: "Unlimited searches", included: true },
      { text: "2,000 AI verification credits/month", included: true, highlight: true },
      { text: "Full lead verification", included: true },
      { text: "White-label exports", included: true },
      { text: "All 16 platform detections", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Unlimited team members", included: true },
      { text: "API access + webhooks", included: true },
      { text: "Exclusive territories (3 included)", included: true },
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-hero">
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
        <section className="py-20 md:py-28">
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
                              <div className="mt-1 text-sm text-emerald-500">
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

                      {/* Features */}
                      <div className="space-y-3 flex-1">
                        {tier.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            {feature.included ? (
                              feature.highlight ? (
                                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              )
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                            )}
                            <span
                              className={
                                feature.highlight
                                  ? "text-foreground font-medium"
                                  : feature.included
                                  ? "text-foreground"
                                  : "text-muted-foreground/60"
                              }
                            >
                              {feature.text}
                            </span>
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
