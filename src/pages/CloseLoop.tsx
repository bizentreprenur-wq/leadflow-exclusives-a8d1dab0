import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Construction,
  Rocket,
  Bell,
  Mail,
  Building2,
  Phone,
  Loader2,
  PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

// Form validation schema
const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  company: z.string().trim().min(2, "Company name required").max(100),
  phone: z.string().trim().optional(),
  message: z.string().trim().max(500).optional(),
});

type SignupData = z.infer<typeof signupSchema>;

const features = [
  {
    icon: RefreshCw,
    title: "Lead Retargeting Ads",
    description: "Every lead is automatically added to follow-up ad campaigns across Facebook, Instagram, YouTube, TikTok, Snapchat, and Google."
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

const stats = [
  { value: "30-50%", label: "Leads typically lost", icon: Users },
  { value: "3x", label: "Higher close rates", icon: TrendingUp },
  { value: "90 days", label: "Lost-lead recovery", icon: Clock },
  { value: "+$1,000s", label: "Revenue recovered", icon: DollarSign }
];

const CloseLoop = () => {
  const [formData, setFormData] = useState<Partial<SignupData>>({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to CRM via webhook (using Zapier-compatible format)
      // Users should configure their CRM webhook URL
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID'; // Placeholder
      
      // For demo purposes, we'll simulate the submission
      // In production, replace with actual webhook URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Attempt to send to webhook (with no-cors for Zapier compatibility)
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            ...result.data,
            source: 'CloseLoop Landing Page',
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          }),
        });
      } catch {
        // Webhook may fail if not configured - that's okay for demo
      }

      setIsSubmitted(true);
      toast.success("You're on the list! 🎉", {
        description: "We'll notify you as soon as CloseLoop™ launches.",
        duration: 5000,
      });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 60px hsl(38 92% 50% / 0.3); }
          50% { box-shadow: 0 0 100px hsl(38 92% 50% / 0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

      <Navbar />
      
      {/* Back Button */}
      <div className="container px-4 pt-6">
        <BackButton />
      </div>
      
      {/* Giant Coming Soon Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Coming Soon Badge - Animated */}
            <div className="mb-8 animate-float">
              <Badge className="closeloop-gradient text-white border-0 px-6 py-3 text-lg font-bold animate-pulse-glow">
                <Construction className="w-6 h-6 mr-2" />
                COMING SOON
              </Badge>
            </div>
            
            {/* Giant Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 tracking-tight">
              <span className="closeloop-text">CloseLoop™</span>
            </h1>
            
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              We Don't Stop at the Lead.
            </p>
            <p className="text-3xl md:text-4xl font-bold closeloop-text mb-8">
              We Advertise Until It Closes.
            </p>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              The most powerful post-lead advertising system is almost here. 
              Get exclusive early access and be the first to transform your lead conversion.
            </p>

            {/* Countdown/Launch indicator */}
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-12">
              <Rocket className="w-6 h-6 animate-bounce" />
              <span className="text-lg font-semibold">Launching Q1 2026</span>
              <Rocket className="w-6 h-6 animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-amber-500/20 bg-card/30">
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

      {/* Signup Form Section - The Main CTA */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-2xl mx-auto">
            {isSubmitted ? (
              /* Success State */
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 closeloop-glow">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full closeloop-gradient flex items-center justify-center animate-bounce">
                    <PartyPopper className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">You're on the VIP List! 🎉</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    We'll email you the moment CloseLoop™ launches. Get ready to transform your lead conversion game!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-500">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">Check your inbox for a confirmation</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Signup Form */
              <Card className="border-amber-500/30 bg-card/80 backdrop-blur-sm closeloop-glow">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full closeloop-gradient flex items-center justify-center">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    Get <span className="closeloop-text">Early Access</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Be the first to know when CloseLoop™ launches. Plus get exclusive founding member pricing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-500" />
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Smith"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className={`bg-background/50 ${errors.name ? 'border-destructive' : 'border-amber-500/30 focus:border-amber-500'}`}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-amber-500" />
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@company.com"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className={`bg-background/50 ${errors.email ? 'border-destructive' : 'border-amber-500/30 focus:border-amber-500'}`}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          Company Name *
                        </Label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="Your Company"
                          value={formData.company || ''}
                          onChange={handleInputChange}
                          className={`bg-background/50 ${errors.company ? 'border-destructive' : 'border-amber-500/30 focus:border-amber-500'}`}
                        />
                        {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-500" />
                          Phone (Optional)
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="bg-background/50 border-amber-500/30 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        What's your biggest lead challenge? (Optional)
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your current lead follow-up challenges..."
                        value={formData.message || ''}
                        onChange={handleInputChange}
                        className="bg-background/50 border-amber-500/30 focus:border-amber-500 min-h-[80px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full closeloop-gradient text-white text-lg py-6 font-bold hover:opacity-90 transition-opacity"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Signing Up...
                        </>
                      ) : (
                        <>
                          <Bell className="w-5 h-5 mr-2" />
                          Notify Me When It Launches
                        </>
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      🔒 We respect your privacy. No spam, ever.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Bonus info */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-card/50 border border-amber-500/20">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium">Early Bird Pricing</p>
                <p className="text-xs text-muted-foreground">Exclusive discounts for early signups</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-amber-500/20">
                <Target className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium">Priority Access</p>
                <p className="text-xs text-muted-foreground">Be first to try new features</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-amber-500/20">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-medium">Free Setup</p>
                <p className="text-xs text-muted-foreground">For founding members only</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-card/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 closeloop-gradient text-white border-0">
              <Sparkles className="w-4 h-4 mr-1" />
              What's Coming
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sneak Peek at <span className="closeloop-text">CloseLoop™</span> Features
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

      {/* Final CTA */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Don't Miss the <span className="closeloop-text">Launch</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of businesses waiting to transform their lead conversion. Sign up above to secure your spot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => document.getElementById('email')?.focus()}
                className="closeloop-gradient text-white border-0 text-lg px-8 py-6 closeloop-glow"
              >
                <Bell className="mr-2 w-5 h-5" />
                Get Early Access
              </Button>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="closeloop-border text-lg px-8 py-6 w-full">
                  Explore BamLead Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
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
