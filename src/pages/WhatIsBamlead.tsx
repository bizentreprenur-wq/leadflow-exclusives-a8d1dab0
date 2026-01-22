import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Search, Users, Mail, Phone, BarChart3, Workflow, 
  Download, Lightbulb, Building2, Target, Shield, Zap 
} from "lucide-react";
import { Helmet } from "react-helmet";

const features = [
  { icon: Search, text: "AI-powered lead discovery" },
  { icon: Users, text: "Decision-maker identification" },
  { icon: Shield, text: "Contact data verification and enrichment" },
  { icon: Mail, text: "Multi-channel outreach (Email, SMS, Calls)" },
  { icon: BarChart3, text: "Built-in CRM and sales pipeline management" },
  { icon: Workflow, text: "Automated sequences and workflow management" },
  { icon: Download, text: "Export and integration options" },
  { icon: Lightbulb, text: "Real-time prospect insights" },
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

const industries = [
  { icon: Building2, text: "Real Estate" },
  { icon: Target, text: "Roofing and Contracting" },
  { icon: Users, text: "Nonprofits and Churches" },
  { icon: Zap, text: "Oil & Gas" },
  { icon: BarChart3, text: "B2B Technology" },
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
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Entity Definition
          </p>
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

        {/* Key Features */}
        <section className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features of Bamlead</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
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
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industries */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Industries Bamlead Supports</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 px-6 py-3 rounded-full border border-border bg-card/50"
              >
                <industry.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{industry.text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Bamlead is suitable for any business looking to find leads faster, verify contacts, 
            and automate outreach without juggling multiple tools.
          </p>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhatIsBamlead;
