import { Search, Users, MessageSquare, UserCheck } from "lucide-react";

const solutions = [
  {
    icon: Search,
    title: "Rank for high-intent local searches",
  },
  {
    icon: Users,
    title: "Attract people actively looking for this service",
  },
  {
    icon: MessageSquare,
    title: "Convert visitors into calls and messages",
  },
  {
    icon: UserCheck,
    title: "Deliver leads directly to one business only",
  },
];

const SolutionSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              The Solution
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              This website removes the guesswork
            </h2>
          </div>

          {/* Solution grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <solution.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {solution.title}
                </p>
              </div>
            ))}
          </div>

          {/* Taglines */}
          <div className="text-center space-y-2">
            <p className="text-xl text-muted-foreground">
              No learning curve.
            </p>
            <p className="text-xl text-muted-foreground">
              No long-term contracts.
            </p>
            <p className="text-xl font-semibold text-foreground">
              Just consistent inbound leads.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
