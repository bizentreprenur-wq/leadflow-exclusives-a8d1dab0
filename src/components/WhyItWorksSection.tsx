import { Zap, Eye, Filter, Target } from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Real-Time Analysis",
    description: "Live website scraping, not cached data from weeks ago",
  },
  {
    icon: Eye,
    title: "10 AI Categories",
    description: "Comprehensive research covering all aspects of a business",
  },
  {
    icon: Filter,
    title: "100+ Data Points",
    description: "Deep intelligence for maximum conversion insights",
  },
  {
    icon: Target,
    title: "Export Ready",
    description: "PDF, Excel, or Google Drive for client presentations",
  },
];

const WhyItWorksSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Why This System Wins
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Prospecting done the smart way
            </h2>
          </div>

          {/* Reasons grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {reasons.map((reason, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6 shadow-card">
                  <reason.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{reason.title}</h3>
                <p className="text-muted-foreground">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItWorksSection;
