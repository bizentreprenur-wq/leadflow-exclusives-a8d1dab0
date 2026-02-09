import { forwardRef } from 'react';

const stats = [
  { value: "2,000+", label: "Leads Per Search" },
  { value: "25+", label: "Industries with Synonym AI" },
  { value: "SWOT", label: "Competitive & Buyer Matching" },
  { value: "3-in-1", label: "Email · Voice · Autopilot" },
];

const StatsSection = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section ref={ref} className="py-10 bg-background border-y border-border" {...props}>
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

export default StatsSection;
