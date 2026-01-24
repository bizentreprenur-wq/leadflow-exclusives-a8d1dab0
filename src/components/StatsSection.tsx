import { forwardRef } from 'react';

const stats = [
  { value: "50K+", label: "Leads Found" },
  { value: "2K+", label: "Digital Professionals" },
  { value: "6", label: "Issue Types Detected" },
  { value: "95%", label: "AI Accuracy" },
];

const StatsSection = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section ref={ref} className="py-16 bg-background border-y border-border" {...props}>
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
