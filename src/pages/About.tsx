import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Lightbulb, Award, ArrowRight } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Precision",
      description: "We believe in quality over quantity. Our tools help you find the right leads, not just more leads.",
    },
    {
      icon: Users,
      title: "Customer Focus",
      description: "Built by web professionals, for web professionals. We understand your challenges because we've faced them too.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We constantly improve our algorithms to provide the most accurate website analysis and lead scoring.",
    },
    {
      icon: Award,
      title: "Integrity",
      description: "Transparent pricing, honest data, and real results. No inflated numbers or misleading claims.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-hero">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                About LeadFinder
              </h1>
              <p className="text-lg text-muted-foreground">
                We're on a mission to help web designers and agencies find clients who actually need their services.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                Our Story
              </h2>
              <div className="prose prose-lg text-muted-foreground space-y-4">
                <p>
                  LeadFinder was born from frustration. As web designers and developers, we spent countless hours 
                  doing cold outreach to businesses, only to find that most of them already had modern, 
                  well-designed websites or weren't interested in upgrading.
                </p>
                <p>
                  We realized there had to be a better way. What if we could identify businesses that actually 
                  needed website help before reaching out? What if we could see which businesses had outdated 
                  WordPress sites, missing mobile responsiveness, or poor SEO?
                </p>
                <p>
                  That's exactly what LeadFinder does. By analyzing Google My Business listings and their 
                  associated websites, we help you find businesses that are prime candidates for your services. 
                  No more wasted time on cold leads.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-foreground mb-12 text-center">
                Our Values
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {values.map((value, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-card border border-border shadow-card"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of web professionals who use LeadFinder to grow their business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="gap-2">
                    View Pricing <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
