import { Palette, Share2, Megaphone, Globe, TrendingUp, Target, Building2, Briefcase } from "lucide-react";

const audiences = [
  { icon: Palette, text: "Website Designers", highlight: true },
  { icon: Share2, text: "Social Media Marketers", highlight: true },
  { icon: Megaphone, text: "Digital Marketing Agencies", highlight: true },
  { icon: Globe, text: "SEO Professionals" },
  { icon: TrendingUp, text: "Lead Generation Agencies" },
  { icon: Building2, text: "Web Development Studios" },
  { icon: Briefcase, text: "Freelance Consultants" },
  { icon: Target, text: "Growth Marketing Teams" },
];

const WhoThisIsForSection = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              Who This Is For
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Built for digital professionals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find businesses with broken websites, weak social presence, missing reviews — clients who need exactly what you offer.
            </p>
          </div>

          {/* Audience list */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {audiences.map((audience, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 ${
                  audience.highlight 
                    ? 'border-primary/50 bg-primary/5 hover:border-primary hover:shadow-lg hover:shadow-primary/10' 
                    : 'border-border bg-card/50 hover:border-primary/30'
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  audience.highlight ? 'bg-primary/20' : 'bg-primary/10'
                }`}>
                  <audience.icon className={`w-5 h-5 ${audience.highlight ? 'text-primary' : 'text-primary/80'}`} />
                </div>
                <p className={`font-medium ${audience.highlight ? 'text-foreground' : 'text-foreground/80'}`}>
                  {audience.text}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom message */}
          <div className="text-center p-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5">
            <p className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
              Stop cold calling. Start closing.
            </p>
            <p className="text-muted-foreground">
              Our Agency Lead Finder shows you exactly which businesses need your services — with AI-powered insights on how to approach them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoThisIsForSection;
