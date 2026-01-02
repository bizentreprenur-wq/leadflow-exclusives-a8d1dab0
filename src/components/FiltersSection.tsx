import { Code, Star, Globe, Smartphone, Search, Building2 } from "lucide-react";

const filters = [
  { icon: Code, text: "Website platform (WordPress only)" },
  { icon: Star, text: "GMB rating" },
  { icon: Globe, text: "No website / broken website" },
  { icon: Smartphone, text: "Mobile performance" },
  { icon: Search, text: "SEO health" },
  { icon: Building2, text: "Industry" },
];

const FiltersSection = () => {
  return (
    <section className="py-24 md:py-32 relative bg-secondary/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Filter & Sort Controls
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Laser-focused outreach
            </h2>
            <p className="text-lg text-muted-foreground">
              Filter results to find exactly the leads you want
            </p>
          </div>

          {/* Filters grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-glow transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <filter.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground font-medium">{filter.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiltersSection;
