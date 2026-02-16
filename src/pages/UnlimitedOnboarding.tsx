import { useEffect } from "react";
import { Check, Crown, Phone, Mail, Brain, Rocket, Calendar, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import confetti from "canvas-confetti";
const setupChecklist = [
  {
    icon: Brain,
    title: "Custom AI Sales Brain",
    description: "We'll train your AI on your niche, objection handling, and industry-specific scripts.",
  },
  {
    icon: Phone,
    title: "AI Calling Setup",
    description: "Dedicated phone number provisioned, call scripts configured, and autonomous calling activated.",
  },
  {
    icon: Mail,
    title: "Drip Email Campaigns",
    description: "7-step intelligent sequences built for your ICP — fully autonomous with AI responses.",
  },
  {
    icon: Rocket,
    title: "Full Campaign Buildout",
    description: "ICP targeting, niche research, and custom proposal templates — all done for you.",
  },
  {
    icon: Users,
    title: "CRM & Calendar Integration",
    description: "We'll connect your CRM (HubSpot, Salesforce, Pipedrive) and calendar for seamless workflow.",
  },
  {
    icon: Calendar,
    title: "Ongoing Managed Support",
    description: "Your dedicated agent monitors performance, optimizes campaigns, and handles escalations.",
  },
];

const UnlimitedOnboarding = () => {
  useEffect(() => {
    confetti({ particleCount: 150, spread: 120, origin: { x: 0.5, y: 0.4 }, colors: ["#ef4444", "#f97316", "#eab308"] });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-16 md:py-24">
        <div className="container px-4 max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <Crown className="w-5 h-5 text-red-500" />
              <span className="text-red-400 font-semibold text-sm">Unlimited Plan — Fully Managed</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to the <span className="text-red-500">Unlimited</span> Experience
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your payment is confirmed. Now let's get everything set up for you.
              Book a call with your dedicated agent below — they'll handle the rest.
            </p>
          </div>

          {/* What to Expect */}
          <div className="mb-12 p-6 rounded-2xl border border-border bg-card">
            <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary" />
              What happens next?
            </h2>
            <ol className="space-y-3 text-muted-foreground ml-7 list-decimal">
              <li>Book your onboarding call below (30 min)</li>
              <li>Your dedicated agent will set up <span className="text-foreground font-medium">everything</span> — AI Calling, Drip Emails, Campaign Targeting</li>
              <li>You start finding leads and watch the AI work for you</li>
            </ol>
          </div>

          {/* Calendly Embed */}
          <div className="mb-12 rounded-2xl border-2 border-red-500/30 bg-card overflow-hidden">
            <div className="p-6 border-b border-border bg-red-500/5">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Book Your Setup Call
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a time that works for you. Your agent will walk you through the full setup.
              </p>
            </div>
            <div className="bg-background">
              <iframe
                src="https://calendly.com/adrian-bamlead/30min"
                width="100%"
                height="700"
                frameBorder="0"
                title="Schedule your BamLead Unlimited onboarding call"
                className="w-full"
              />
            </div>
          </div>

          {/* Setup Checklist */}
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
              Everything We'll Configure For You
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {setupChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-border bg-card hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-red-500/10 shrink-0">
                      <item.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                        {item.title}
                        <Check className="w-4 h-4 text-red-500" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA to Dashboard */}
          <div className="text-center p-8 rounded-2xl border border-border bg-secondary/30">
            <h3 className="font-display text-xl font-bold text-foreground mb-3">
              Already booked? Head to your dashboard
            </h3>
            <p className="text-muted-foreground mb-6">
              Start finding leads now — your agent will configure the rest in the background.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline">
                  Start Searching Leads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UnlimitedOnboarding;
