import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Home, Wrench, Church, Laptop, Fuel, 
  Search, Mail, Calendar, BarChart3 
} from "lucide-react";
import { Helmet } from "react-helmet";

const useCases = [
  {
    title: "Real Estate",
    icon: Home,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bullets: [
      "Identify property buyers, investors, and agencies",
      "Target leads by location, property type, or budget",
      "Automate follow-ups via email, SMS, or calls",
      "Track engagement and pipeline progress",
    ],
  },
  {
    title: "Roofing & Contractors",
    icon: Wrench,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    bullets: [
      "Discover local contractors and service providers",
      "Find decision-makers for home improvement projects",
      "Automate outreach for estimates, proposals, and appointments",
      "Monitor responses and schedule follow-ups",
    ],
  },
  {
    title: "Churches & Nonprofits",
    icon: Church,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    bullets: [
      "Find churches or nonprofit organizations without websites or CRM systems",
      "Identify decision-makers for outreach or partnerships",
      "Send automated email or SMS campaigns",
      "Track engagement for fundraising or event promotion",
    ],
  },
  {
    title: "B2B Technology",
    icon: Laptop,
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    bullets: [
      "Target companies in need of software or tech solutions",
      "Identify decision-makers by role (CTO, IT Manager, Operations)",
      "Automate multi-channel outreach campaigns",
      "Measure responses and optimize engagement workflows",
    ],
  },
  {
    title: "Oil & Gas / Industrial B2B",
    icon: Fuel,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bullets: [
      "Locate businesses in specific sectors (oil refineries, fuel suppliers, etc.)",
      "Identify operational or procurement decision-makers",
      "Automate prospect outreach and follow-ups",
      "Track engagement and update CRM pipelines",
    ],
  },
];

const UseCases = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Bamlead use cases include real estate, roofing, contractors, churches, nonprofits, B2B technology, and oil & gas. The platform helps businesses find, verify, and engage prospects via AI-powered lead generation and multi-channel outreach.",
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
        <title>Bamlead Use Cases | Industries We Serve</title>
        <meta name="description" content="Discover how Bamlead serves real estate, roofing, churches, nonprofits, B2B tech, and industrial sectors with AI-powered lead generation and outreach." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Industry Applications
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Bamlead <span className="text-primary">Use Cases</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bamlead supports a wide range of industries, providing actionable insights and 
            automation to accelerate customer acquisition. See how different sectors leverage 
            our AI-powered platform.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className={`p-6 rounded-2xl border ${useCase.color} bg-card/30 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl ${useCase.color} flex items-center justify-center`}>
                  <useCase.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{useCase.title}</h2>
              </div>
              
              <ul className="space-y-3">
                {useCase.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-16 text-center p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <h3 className="text-2xl font-bold text-foreground mb-4">Don't See Your Industry?</h3>
          <p className="text-muted-foreground">
            Bamlead works for any B2B business that needs to find leads, verify contacts, 
            and automate outreach. Our AI adapts to your specific industry requirements.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UseCases;
