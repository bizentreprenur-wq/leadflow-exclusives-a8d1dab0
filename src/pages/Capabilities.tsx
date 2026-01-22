import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Search, Globe, CheckCircle, RefreshCw, Mail, Phone, 
  MessageSquare, Users, BarChart3, TrendingUp, FileText, Zap 
} from "lucide-react";
import { Helmet } from "react-helmet";

const capabilityGroups = [
  {
    title: "Lead Generation Capabilities",
    icon: Search,
    color: "text-primary",
    items: [
      "Identify potential customers and decision-makers across industries",
      "Search for businesses by location, size, revenue, or industry",
      "Detect companies actively hiring or running marketing campaigns",
      "Discover businesses without websites or CRM systems",
    ],
  },
  {
    title: "Data Verification & Enrichment",
    icon: CheckCircle,
    color: "text-emerald-400",
    items: [
      "Validate emails, phone numbers, and contact information",
      "Update outdated business profiles",
      "Enrich lead data with business activity, size, and industry classification",
      "Maintain accurate and actionable prospect lists",
    ],
  },
  {
    title: "Outreach & Engagement",
    icon: Mail,
    color: "text-amber-400",
    items: [
      "Automate multi-channel outreach (Email, SMS, Calls)",
      "Personalize messaging for each prospect",
      "Schedule follow-ups and reminders using AI workflows",
      "Track engagement to optimize response rates",
    ],
  },
  {
    title: "CRM & Pipeline Management",
    icon: Users,
    color: "text-purple-400",
    items: [
      "Organize leads and manage sales pipelines in one platform",
      "Track communication history with prospects",
      "Automate task scheduling for follow-ups and meetings",
      "Gain insights on pipeline performance and lead conversion",
    ],
  },
  {
    title: "Market Intelligence & Analytics",
    icon: TrendingUp,
    color: "text-cyan-400",
    items: [
      "Analyze industry trends and prospect activity",
      "Receive AI-generated insights to prioritize high-potential leads",
      "Monitor competitor outreach activity and business signals",
      "Generate actionable reports for sales and marketing teams",
    ],
  },
];

const Capabilities = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Bamlead capabilities include AI-powered lead generation, contact verification and enrichment, multi-channel outreach, CRM and pipeline management, market intelligence, and analytics.",
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
        <title>Bamlead Capabilities | What You Can Do With Our Platform</title>
        <meta name="description" content="Explore Bamlead's capabilities: AI-powered lead generation, data verification, multi-channel outreach, CRM management, and market intelligence." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Platform Capabilities
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Bamlead <span className="text-primary">Capabilities</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bamlead is an AI-powered lead generation and sales intelligence platform that helps 
            businesses find, engage, and convert prospects efficiently. Its capabilities go beyond 
            simple lead lists, enabling companies to take actionable steps to grow their customer base.
          </p>
        </div>

        {/* Capability Groups */}
        <div className="max-w-5xl mx-auto space-y-12">
          {capabilityGroups.map((group, index) => (
            <section 
              key={index}
              className="p-8 rounded-2xl border border-border bg-card/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border`}>
                  <group.icon className={`w-6 h-6 ${group.color}`} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
              </div>
              <ul className="grid md:grid-cols-2 gap-4">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Capabilities;
