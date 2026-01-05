import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Search, Globe, Zap, Shield, BarChart3, Users, 
  CheckCircle, ArrowRight, Building2, Smartphone, Eye 
} from "lucide-react";

const Features = () => {
  const mainFeatures = [
    {
      icon: Search,
      title: "Smart Business Search",
      description: "Search Google My Business listings by service type and location to find businesses actively operating in your target market.",
    },
    {
      icon: Globe,
      title: "Website Analysis",
      description: "Automatically detect website platforms (WordPress, Wix, Squarespace) and identify outdated technologies that need upgrading.",
    },
    {
      icon: Smartphone,
      title: "Mobile Responsiveness Check",
      description: "Instantly see which businesses have mobile-unfriendly websites that are losing customers on phones and tablets.",
    },
    {
      icon: Eye,
      title: "SEO Issue Detection",
      description: "Identify missing meta descriptions, outdated HTML, and other SEO problems that hurt search rankings.",
    },
    {
      icon: BarChart3,
      title: "Lead Scoring",
      description: "Prioritize leads based on website issues detected, helping you focus on businesses most likely to convert.",
    },
    {
      icon: Building2,
      title: "Platform Detection",
      description: "Know exactly what CMS or platform each business uses, so you can tailor your pitch accordingly.",
    },
  ];

  const benefits = [
    "Find businesses that actually need your services",
    "Stop wasting time on cold outreach",
    "Get detailed website analysis instantly",
    "Export leads to CSV for your CRM",
    "Filter by platform, location, and issues",
    "Real-time data from Google My Business",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                Powerful Features for
                <span className="block text-gradient">Finding Quality Leads</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need to identify businesses with outdated websites and turn them into clients.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Why Choose BamLead?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Built specifically for web designers, agencies, and freelancers.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
                  >
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ready to Find Your Next Clients?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your free trial today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="gap-2">
                    View Pricing <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline">
                    Try Demo Search
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
