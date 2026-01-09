import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Target, 
  Zap, 
  MapPin, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Sparkles,
  Construction
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CloseLoopComparisonSlider from "@/components/CloseLoopComparisonSlider";

const handleComingSoon = () => {
  toast.info("CloseLoop™ is coming soon!", {
    description: "We're putting the finishing touches on our powerful post-lead advertising system. Sign up to be notified when it launches!",
    duration: 5000,
    icon: <Construction className="w-5 h-5 text-amber-500" />
  });
};

const features = [
  {
    icon: RefreshCw,
    title: "Lead Retargeting Ads",
    description: "Every lead is automatically added to follow-up ad campaigns across Facebook, Google, and YouTube."
  },
  {
    icon: Sparkles,
    title: "AI-Optimized Ad Messaging",
    description: "Ad copy adapts based on lead behavior and response patterns using intelligent automation."
  },
  {
    icon: Clock,
    title: "Lost-Lead Resurrection",
    description: "Leads marked 'not now' or 'no response' are re-engaged over 30–90 days automatically."
  },
  {
    icon: MapPin,
    title: "ZIP-Code Domination",
    description: "Ads only run in the exact areas your leads live, making you look dominant locally."
  },
  {
    icon: BarChart3,
    title: "Revenue Tracking",
    description: "See which ads produce real jobs — not just clicks. Track cost per CLOSED deal."
  },
  {
    icon: Target,
    title: "Behavior-Based Sequences",
    description: "Different ads for different actions: didn't answer, clicked but didn't book, no-showed."
  }
];

const pricingTiers = [
  {
    name: "CloseLoop™ Lite",
    price: "$297",
    period: "/month",
    color: "from-emerald-500 to-emerald-600",
    features: [
      "Lead retargeting ads",
      "Testimonial & reminder ads",
      "Pixel & audience setup",
      "Facebook & Google integration"
    ]
  },
  {
    name: "CloseLoop™ Pro",
    price: "$597",
    period: "/month",
    popular: true,
    color: "from-amber-500 to-orange-500",
    features: [
      "Everything in Lite, plus:",
      "Behavior-based ad sequences",
      "No-show reduction ads",
      "Appointment confirmation ads",
      "AI-generated ad variations"
    ]
  },
  {
    name: "CloseLoop™ Revenue+",
    price: "$997",
    period: "/month",
    color: "from-rose-500 to-red-600",
    features: [
      "Everything in Pro, plus:",
      "Lost-lead resurrection campaigns",
      "ZIP-code takeover ads",
      "Revenue attribution dashboard",
      "Cost per CLOSED deal tracking"
    ]
  }
];

const stats = [
  { value: "30-50%", label: "Leads typically lost", icon: Users },
  { value: "3x", label: "Higher close rates", icon: TrendingUp },
  { value: "90 days", label: "Lost-lead recovery", icon: Clock },
  { value: "+$1,000s", label: "Revenue recovered", icon: DollarSign }
];

const CloseLoop = () => {
  return (
    <div className="min-h-screen bg-background closeloop-theme">
      {/* Custom amber/orange themed styles */}
      <style>{`
        .closeloop-theme {
          --closeloop-primary: 38 92% 50%;
          --closeloop-secondary: 25 95% 53%;
          --closeloop-glow: 38 92% 50%;
        }
        .closeloop-gradient {
          background: linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(25 95% 53%) 100%);
        }
        .closeloop-text {
          background: linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(25 95% 53%) 50%, hsl(15 90% 55%) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .closeloop-glow {
          box-shadow: 0 0 60px hsl(38 92% 50% / 0.3);
        }
        .closeloop-border {
          border-color: hsl(38 92% 50% / 0.3);
        }
      `}</style>

      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 closeloop-gradient text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Zap className="w-4 h-4 mr-1" />
              Exclusive BamLead Module
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-foreground">BamLead</span>{" "}
              <span className="closeloop-text">CloseLoop™</span>
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              We Don't Stop at the Lead.
            </p>
            <p className="text-2xl md:text-3xl font-semibold closeloop-text mb-8">
              We Advertise Until It Closes.
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Most lead companies hand you a name and number… then disappear. 
              CloseLoop™ continues advertising to your leads until they book, show up, and buy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleComingSoon} className="closeloop-gradient text-white border-0 text-lg px-8 py-6 closeloop-glow">
                Book a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleComingSoon} className="closeloop-border text-lg px-8 py-6">
                See Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-amber-500" />
                <div className="text-3xl md:text-4xl font-bold closeloop-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Problem <span className="closeloop-text">No One Talks About</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Companies don't lose money because of no leads. They lose money because:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              "Leads don't answer the phone",
              "Leads go cold after first contact",
              "Appointments no-show",
              "No follow-up after the first contact"
            ].map((problem, index) => (
              <Card key={index} className="bg-card/50 border-amber-500/20 hover:border-amber-500/40 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-10 h-10 rounded-full closeloop-gradient flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <p className="text-foreground font-medium">{problem}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-lg text-muted-foreground mt-10 max-w-2xl mx-auto">
            Traditional agencies stop at the form fill. <span className="closeloop-text font-semibold">That's where BamLead starts.</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Makes <span className="closeloop-text">CloseLoop™</span> Different
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete post-lead advertising system that follows every lead until conversion.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-amber-500/30 transition-all group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl closeloop-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="closeloop-text">CloseLoop™</span> Works
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { trigger: "Lead doesn't answer", action: "→ They see reminder ads" },
              { trigger: "Lead clicks but doesn't book", action: "→ They see trust & proof ads" },
              { trigger: "Lead no-shows", action: "→ They see appointment reinforcement ads" },
              { trigger: "Lead goes cold", action: "→ They are re-engaged weeks or months later" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-amber-500/20">
                <div className="w-10 h-10 rounded-full closeloop-gradient flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                  <span className="text-foreground font-medium">{item.trigger}</span>
                  <span className="text-amber-500 font-semibold">{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Slider */}
      <section className="py-20 bg-card/30">
        <div className="container px-4">
          <CloseLoopComparisonSlider />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-card/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, <span className="closeloop-text">Transparent Pricing</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your business goals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`relative bg-card border-border overflow-hidden ${
                  tier.popular ? 'border-amber-500 ring-2 ring-amber-500/20' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 closeloop-gradient text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground">{tier.name}</h3>
                  <div className="mb-6">
                    <span className={`text-4xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                      {tier.price}
                    </span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${tier.popular ? 'closeloop-gradient text-white' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={handleComingSoon}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to <span className="closeloop-text">Close More Deals</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We don't just generate leads. We stay in the game until the money is made.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleComingSoon} className="closeloop-gradient text-white border-0 text-lg px-8 py-6 closeloop-glow">
                Book a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="closeloop-border text-lg px-8 py-6 w-full">
                  Explore BamLead Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CloseLoop;
