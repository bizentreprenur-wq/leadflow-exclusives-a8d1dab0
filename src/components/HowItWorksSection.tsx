import { Search, Mail, Phone, Rocket, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Search",
    description: "Pick a business type and location. BamLead finds real businesses that need your help!",
    color: "primary",
    emoji: "🔍",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Review",
    description: "See all the leads in a nice list. Pick the ones you want to contact. Easy peasy!",
    color: "accent",
    emoji: "📋",
  },
  {
    number: "03",
    icon: Mail,
    title: "Email",
    description: "Send emails with beautiful templates. The AI helps you write messages that get replies!",
    color: "success",
    emoji: "📧",
  },
  {
    number: "04",
    icon: Phone,
    title: "Call",
    description: "Let AI call your leads for you! It sounds totally human and qualifies leads automatically.",
    color: "primary",
    emoji: "📞",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-3">
            Simple Process
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Find high-quality leads in minutes, not hours. Our streamlined process gets you from search to outreach faster.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colorClass = step.color === "primary" 
              ? "bg-primary/10 text-primary" 
              : step.color === "accent" 
                ? "bg-accent/10 text-accent" 
                : "bg-success/10 text-success";
            
            return (
              <div 
                key={step.number} 
                className="relative group"
              >
                {/* Connector Line (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-[2px] bg-border" />
                )}
                
                <div className="relative bg-background rounded-2xl p-6 border border-border shadow-card hover:shadow-elevated transition-all duration-300 h-full">
                  {/* Step Number with Emoji */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-foreground text-background text-lg flex items-center justify-center">
                    {step.emoji}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    Step {step.number}: {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
