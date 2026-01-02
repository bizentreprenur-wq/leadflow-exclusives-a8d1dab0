import { Zap, Eye, Filter, Target } from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Live Data",
    description: "Real-time data from search engines",
  },
  {
    icon: Eye,
    title: "Already Visible",
    description: "Businesses already spending effort to be visible",
  },
  {
    icon: Filter,
    title: "Pre-Qualified",
    description: "Website detection removes unqualified prospects",
  },
  {
    icon: Target,
    title: "Conversion Ready",
    description: "Built for conversion-ready outreach",
  },
];

const WhyItWorksSection = () => {
  return (
    <section className="py-24 md:py-32">
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
