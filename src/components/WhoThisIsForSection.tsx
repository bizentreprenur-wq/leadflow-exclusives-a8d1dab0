import { TrendingUp, Users, Megaphone, Building2, Briefcase, Target } from "lucide-react";

const audiences = [
  { icon: TrendingUp, text: "B2B Sales Teams" },
  { icon: Users, text: "Recruiters & HR" },
  { icon: Megaphone, text: "Marketing Agencies" },
  { icon: Building2, text: "SaaS Companies" },
  { icon: Briefcase, text: "Service Providers" },
  { icon: Target, text: "Lead Gen Agencies" },
];

const WhoThisIsForSection = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Who This Is For
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Built for modern B2B teams
            </h2>
          </div>

          {/* Audience list */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {audiences.map((audience, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-6 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <audience.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">{audience.text}</p>
              </div>
            ))}
          </div>

          {/* Bottom message */}
          <div className="text-center p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <p className="text-xl md:text-2xl font-display font-semibold text-foreground">
              If you need qualified leads, this tool removes hours of manual research.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoThisIsForSection;
