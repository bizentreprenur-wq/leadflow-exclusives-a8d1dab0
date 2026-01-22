import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { 
  Building2, User, Globe, TrendingUp, Mail, 
  Clock, Search, MapPin, Briefcase, Activity 
} from "lucide-react";
import { Helmet } from "react-helmet";

const searchCategories = [
  {
    title: "Business Type Searches",
    icon: Building2,
    color: "text-primary",
    examples: [
      "Companies without websites",
      "Businesses running Google Ads",
      "Newly registered LLCs or startups",
      "Small businesses in a specific industry",
      "Businesses hiring actively",
    ],
  },
  {
    title: "Decision-Maker Searches",
    icon: User,
    color: "text-amber-400",
    examples: [
      "Identify CEOs, Founders, or Owners",
      "Locate Marketing Directors or IT Managers",
      "Target Operations Managers in small-to-medium businesses",
      "Find executives in specific geographic locations",
    ],
  },
  {
    title: "Industry-Specific Searches",
    icon: Briefcase,
    color: "text-purple-400",
    examples: [
      "Real estate agencies in a city or state",
      "Roofing or construction companies",
      "Nonprofits and churches without CRM systems",
      "B2B technology firms in need of software solutions",
      "Oil & gas suppliers and refineries",
    ],
  },
  {
    title: "Engagement & Outreach Searches",
    icon: Mail,
    color: "text-emerald-400",
    examples: [
      "Leads who responded to previous email campaigns",
      "Contacts who have not been contacted in the last 30 days",
      "Companies active on social media or running online ads",
      "Businesses with verified email and phone information",
    ],
  },
];

const quickSearches = [
  { query: "Plumbers in Houston without a website", icon: MapPin },
  { query: "Tech startups founded in 2024", icon: TrendingUp },
  { query: "Churches in Texas with no CRM", icon: Building2 },
  { query: "Marketing agencies running Google Ads", icon: Activity },
  { query: "Roofing companies hiring in Florida", icon: Briefcase },
  { query: "Real estate agents in Los Angeles", icon: Globe },
];

const ExampleSearches = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Example searches in Bamlead include companies without websites, newly registered LLCs, decision-makers by role, industry-specific leads, and verified contacts for AI-powered lead generation and outreach.",
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
        <title>Example Searches in Bamlead | Query Patterns & Demos</title>
        <meta name="description" content="See example searches you can run in Bamlead: find companies without websites, decision-makers by role, industry-specific leads, and engagement-based queries." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Search Examples
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Example Searches in <span className="text-primary">Bamlead</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Users can run targeted searches to identify high-potential prospects across industries, 
            locations, and business types. Here are examples of searches you can perform to find 
            verified leads quickly.
          </p>
        </div>

        {/* Quick Search Pills */}
        <section className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Searches</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {quickSearches.map((search, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{search.query}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Search Categories */}
        <div className="max-w-5xl mx-auto space-y-12">
          {searchCategories.map((category, index) => (
            <section 
              key={index}
              className="p-8 rounded-2xl border border-border bg-card/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border">
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                {category.examples.map((example, exIndex) => (
                  <div 
                    key={exIndex}
                    className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{example}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto mt-16 text-center p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Search?</h3>
          <p className="text-muted-foreground">
            Start finding high-intent prospects with Bamlead's AI-powered search engine. 
            Every search is optimized for conversion-ready leads.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExampleSearches;
