const steps = [
  {
    number: "01",
    title: "The Website Is Built & Ranked",
    description: "The site is created with SEO, speed, and conversion in mind and optimized to appear in local search results.",
  },
  {
    number: "02",
    title: "Leads Start Coming In",
    description: "Customers searching for this service find the site and submit inquiries or call directly.",
  },
  {
    number: "03",
    title: "One Business Gets Exclusive Access",
    description: "Only one business per area can subscribe. All leads go to you — no sharing.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Three simple steps to consistent leads
            </h2>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  {/* Step number */}
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border mb-8 shadow-card">
                    <span className="text-3xl font-bold text-gradient">{step.number}</span>
                    {/* Connector dot */}
                    <div className="hidden md:block absolute -bottom-[2.6rem] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-glow" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
