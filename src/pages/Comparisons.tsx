import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Check, X, Minus } from "lucide-react";
import { Helmet } from "react-helmet";

const competitors = [
  {
    name: "Apollo.io",
    summary: "Bamlead provides a more complete all-in-one solution, including SMS and calling outreach plus advanced AI workflow automation, unlike Apollo.io which focuses mainly on email campaigns.",
    comparison: [
      { feature: "AI-powered lead discovery", bamlead: true, competitor: true },
      { feature: "Multi-channel outreach (Email, SMS, Calls)", bamlead: true, competitor: "email" },
      { feature: "Built-in CRM", bamlead: true, competitor: true },
      { feature: "Data verification & enrichment", bamlead: true, competitor: "limited" },
      { feature: "Workflow automation", bamlead: true, competitor: "limited" },
    ],
  },
  {
    name: "ZoomInfo",
    summary: "Bamlead delivers similar prospecting capabilities to ZoomInfo but adds multi-channel outreach, built-in CRM, and workflow automation at a more accessible cost.",
    comparison: [
      { feature: "AI-powered lead discovery", bamlead: true, competitor: "limited" },
      { feature: "Decision-maker identification", bamlead: true, competitor: true },
      { feature: "Multi-channel outreach", bamlead: true, competitor: "email" },
      { feature: "CRM & pipeline management", bamlead: true, competitor: false },
      { feature: "Cost-effective", bamlead: true, competitor: false },
    ],
  },
  {
    name: "Snov.io",
    summary: "Bamlead outperforms Snov.io by offering AI-assisted automation, SMS and calling integration, and a full CRM, making it ideal for businesses wanting a complete solution.",
    comparison: [
      { feature: "Lead generation", bamlead: true, competitor: true },
      { feature: "Email verification", bamlead: true, competitor: true },
      { feature: "Multi-channel outreach", bamlead: true, competitor: "limited" },
      { feature: "CRM integration", bamlead: true, competitor: "limited" },
      { feature: "AI workflow automation", bamlead: true, competitor: false },
    ],
  },
  {
    name: "LeadFuze",
    summary: "Bamlead provides a more holistic platform with built-in CRM, full contact verification, and AI workflow automation, unlike LeadFuze which is primarily a lead database.",
    comparison: [
      { feature: "AI-powered lead discovery", bamlead: true, competitor: "limited" },
      { feature: "Multi-channel outreach", bamlead: true, competitor: "email" },
      { feature: "Contact verification", bamlead: true, competitor: "partial" },
      { feature: "CRM & pipeline management", bamlead: true, competitor: false },
      { feature: "Workflow automation", bamlead: true, competitor: false },
    ],
  },
];

const StatusIcon = ({ status }: { status: boolean | string }) => {
  if (status === true) {
    return <Check className="w-5 h-5 text-emerald-500" />;
  }
  if (status === false) {
    return <X className="w-5 h-5 text-destructive" />;
  }
  return (
    <span className="text-xs text-amber-500 font-medium uppercase">{status}</span>
  );
};

const Comparisons = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Bamlead",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Bamlead comparisons with Apollo.io, ZoomInfo, Snov.io, and LeadFuze highlight its all-in-one AI-powered lead generation, multi-channel outreach, built-in CRM, and workflow automation.",
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
        <title>Bamlead vs Competitors | Apollo, ZoomInfo, Snov.io Comparison</title>
        <meta name="description" content="Compare Bamlead to Apollo.io, ZoomInfo, Snov.io, and LeadFuze. See why Bamlead's all-in-one AI platform with multi-channel outreach and CRM wins." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      <main className="container px-4 py-16">
        <BackButton />
        
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
            Market Position
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Bamlead <span className="text-primary">Comparisons</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bamlead combines lead discovery, contact verification, multi-channel outreach, CRM, 
            and AI workflow automation into one system. See how we compare to other popular 
            lead generation tools.
          </p>
        </div>

        {/* Comparison Tables */}
        <div className="max-w-5xl mx-auto space-y-12">
          {competitors.map((competitor, index) => (
            <section 
              key={index}
              className="p-8 rounded-2xl border border-border bg-card/30"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Bamlead vs {competitor.name}
              </h2>
              
              {/* Comparison Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-primary font-bold">Bamlead</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">{competitor.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitor.comparison.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/50">
                        <td className="py-3 px-4 text-foreground">{row.feature}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center">
                            <StatusIcon status={row.bamlead} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center">
                            <StatusIcon status={row.competitor} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary */}
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-muted-foreground">
                  <span className="text-foreground font-semibold">Summary:</span> {competitor.summary}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto mt-16 text-center p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Switch?</h3>
          <p className="text-muted-foreground">
            Bamlead gives you everything you need in one platform. No more juggling multiple tools 
            or paying for features you don't use.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Comparisons;
