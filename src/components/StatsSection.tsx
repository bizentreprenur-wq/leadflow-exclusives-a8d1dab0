import { forwardRef } from 'react';

const stats = [
  { value: "10", label: "AI Research Categories" },
  { value: "100+", label: "Data Points Analyzed" },
  { value: "Real-Time", label: "Website Analysis" },
  { value: "3", label: "Export Formats (PDF/Excel/Drive)" },
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
