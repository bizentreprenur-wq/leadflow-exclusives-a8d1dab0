import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Building2, User, Phone, Mail, Globe, MapPin, 
  Calendar, TrendingUp, Briefcase, Link2, Activity, Target 
} from "lucide-react";
import { Helmet } from "react-helmet";

const dataCategories = [
  {
    title: "Business Information",
    icon: Building2,
    color: "bg-primary/10 text-primary",
    fields: [
      { label: "Business name", icon: Building2 },
      { label: "Industry classification", icon: Target },
      { label: "Business category", icon: Briefcase },
      { label: "Company size", icon: TrendingUp },
      { label: "Location (city, state, country)", icon: MapPin },
      { label: "Business registration date", icon: Calendar },
      { label: "Advertising activity (Google Ads, social)", icon: Activity },
      { label: "Hiring signals / active job postings", icon: User },
      { label: "Website status (active, inactive, missing)", icon: Globe },
    ],
  },
  {
    title: "Decision-Maker & Contact Information",
    icon: User,
    color: "bg-amber-500/10 text-amber-400",
    fields: [
      { label: "Decision-maker full name", icon: User },
      { label: "Job title / role", icon: Briefcase },
      { label: "Email address (verified)", icon: Mail },
      { label: "Phone number (verified)", icon: Phone },
      { label: "LinkedIn or social profile links", icon: Link2 },
      { label: "Preferred communication method", icon: Mail },
    ],
  },
  {
    title: "Operational & Market Signals",
    icon: Activity,
    color: "bg-emerald-500/10 text-emerald-400",
    fields: [
      { label: "Company growth indicators", icon: TrendingUp },
      { label: "Market sector or niche", icon: Target },
      { label: "Business activity level", icon: Activity },
      { label: "Online presence signals (website, ads, social media)", icon: Globe },
    ],
  },
];

const DataTypes = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Bamlead indexes business and contact data fields including company name, industry, size, location, decision-maker contacts, email, phone, hiring signals, website status, and advertising activity for AI-powered lead generation and outreach.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bamlead"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Data Fields in Bamlead | Business & Contact Data We Index</title>
        <meta name="description" content="Explore the data fields Bamlead indexes: business information, decision-maker contacts, market signals, and operational data for AI-powered lead generation." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Indexed Data
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Data Fields Available in <span className="text-primary">Bamlead</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bamlead collects, verifies, and organizes business and contact information to help 
            companies identify, reach, and engage high-potential prospects. The following data 
            fields are indexed and available for search and outreach.
          </p>
        </div>

        {/* Data Categories */}
        <div className="max-w-5xl mx-auto space-y-12">
          {dataCategories.map((category, index) => (
            <section 
              key={index}
              className="p-8 rounded-2xl border border-border bg-card/30"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.fields.map((field, fieldIndex) => (
                  <div 
                    key={fieldIndex}
                    className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-border/50"
                  >
                    <field.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{field.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="max-w-3xl mx-auto mt-16 text-center p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <p className="text-lg text-muted-foreground">
            All data is verified and enriched using AI to ensure accuracy and actionability 
            for your outreach campaigns.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DataTypes;
