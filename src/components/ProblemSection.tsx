import { Clock, DollarSign, FileText, MousePointerClick } from "lucide-react";

const problems = [
  {
    icon: Clock,
    text: "Google rankings take time and expertise",
  },
  {
    icon: DollarSign,
    text: "Ads get more expensive every year",
  },
  {
    icon: FileText,
    text: "Marketing agencies lock you into contracts",
  },
  {
    icon: MousePointerClick,
    text: "Websites don't actually convert visitors",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              The Problem
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Most businesses struggle with online leads
            </h2>
            <p className="text-lg text-muted-foreground">
              You shouldn't have to become a marketer just to get customers.
            </p>
          </div>

          {/* Problem cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <problem.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="text-lg font-medium text-foreground pt-2">
                    {problem.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
