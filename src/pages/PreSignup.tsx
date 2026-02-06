import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Zap, 
  Mail, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  Rocket
} from "lucide-react";
import mascot from "@/assets/bamlead-mascot.png";

const PreSignup = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to mailto link (opens email client) or use a simple form service
      const mailtoLink = `mailto:adrian@bamlead.com?subject=Bamlead Pre-Signup Interest&body=Name: ${encodeURIComponent(name)}%0D%0AEmail: ${encodeURIComponent(email)}%0D%0ACompany: ${encodeURIComponent(company)}%0D%0A%0D%0AI'm interested in early access to Bamlead!`;
      
      // Open mailto link in background
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.click();

      setIsSubmitted(true);
      toast.success("Thanks for your interest! We'll be in touch soon.");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: "AI-Powered Lead Discovery",
      description: "Find thousands of qualified leads in seconds using advanced AI search"
    },
    {
      icon: Mail,
      title: "Automated Email Outreach",
      description: "Smart drip campaigns that convert cold leads into paying customers"
    },
    {
      icon: Brain,
      title: "Intelligent Lead Scoring",
      description: "AI analyzes and ranks leads based on conversion probability"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analytics",
      description: "Track opens, clicks, and responses with detailed insights"
    }
  ];

  const stats = [
    { value: "10x", label: "Faster Lead Gen" },
    { value: "85%", label: "Time Saved" },
    { value: "3x", label: "More Conversions" }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">You're on the list!</h1>
          <p className="text-muted-foreground mb-8">
            Thanks for your interest in Bamlead. We'll notify you as soon as early access is available.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Back to signup
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30" />
        
        <div className="container relative px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Coming Soon</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Generate Leads on{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">
                  Autopilot
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                Bamlead uses AI to find, verify, and reach out to your ideal customers automatically. 
                Stop cold calling. Start closing.
              </p>

              {/* Stats */}
              <div className="flex gap-8 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Mobile mascot */}
              <div className="lg:hidden flex justify-center mb-8">
                <img src={mascot} alt="Bamlead Mascot" className="w-48 h-auto" />
              </div>
            </motion.div>

            {/* Right content - Signup Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="hidden lg:block">
                      <img src={mascot} alt="Bamlead Mascot" className="w-16 h-auto" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Get Early Access</h2>
                      <p className="text-muted-foreground">Be first in line when we launch</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-foreground">Company Name</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your Company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="h-12 bg-background/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-lg shadow-primary/25"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Joining...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Join the Waitlist
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      🔒 No spam. Unsubscribe anytime.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What You'll Get Access To
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI tools to supercharge your lead generation and outreach
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-amber-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative px-8 py-16 md:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
                <Rocket className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Limited Early Access</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Lead Gen?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                Join hundreds of businesses waiting for Bamlead. Get exclusive early access and special launch pricing.
              </p>
              
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                size="xl"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Reserve Your Spot Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Bamlead. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PreSignup;
