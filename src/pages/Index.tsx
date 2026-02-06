import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import LeadGenSection from "@/components/LeadGenSection";
import EmailOutreachSection from "@/components/EmailOutreachSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhoThisIsForSection from "@/components/WhoThisIsForSection";
import WhyItWorksSection from "@/components/WhyItWorksSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import NewFeaturesShowcase from "@/components/NewFeaturesShowcase";
import FreeTrialBanner from "@/components/FreeTrialBanner";
import SecretAISection from "@/components/SecretAISection";
import RevolutionaryFeaturesSection from "@/components/RevolutionaryFeaturesSection";
import AgentCardsSection from "@/components/AgentCardsSection";
import WhenAIActivatesSection from "@/components/WhenAIActivatesSection";
import SponsorSection from "@/components/SponsorSection";
import VoiceCallingSection from "@/components/VoiceCallingSection";
import ROICalculatorSection from "@/components/ROICalculatorSection";
import AIEmailAssistantDemo from "@/components/AIEmailAssistantDemo";
import SuperAIFeaturesSection from "@/components/SuperAIFeaturesSection";
import AIAutopilotCampaignPromo from "@/components/AIAutopilotCampaignPromo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Temporary Pre-Launch Banner */}
      <div className="bg-primary text-primary-foreground py-3 px-4 text-center">
        <p className="text-sm md:text-base font-medium">
          🚀 BamLead is launching soon!{" "}
          <Link to="/presignup" className="underline font-bold hover:opacity-80">
            Join the waitlist
          </Link>{" "}
          to get early access and exclusive benefits.
        </p>
      </div>
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroSection />
        
        {/* AI Autopilot Campaign Promo - Prominent placement */}
        <AIAutopilotCampaignPromo />
        
        <section className="container px-4 py-8">
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">See the Mailbox + AI Autopilot Campaign</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Open the interactive mailbox UI with AI Autopilot, drip sequences, and PreDone Documents.
              </p>
            </div>
            <Button asChild>
              <Link to="/mailbox-demo">Open Mailbox Demo</Link>
            </Button>
          </div>
        </section>
        <SuperAIFeaturesSection />
        <HowItWorksSection />
        <AgentCardsSection />
        <VoiceCallingSection />
        <WhenAIActivatesSection />
        <RevolutionaryFeaturesSection />
        <SecretAISection />
        <StatsSection />
        <ROICalculatorSection />
        <NewFeaturesShowcase />
        <LeadGenSection />
        <AIEmailAssistantDemo />
        <EmailOutreachSection />
        <WhoThisIsForSection />
        <WhyItWorksSection />
        <FAQSection />
        <SponsorSection />
        <div className="container px-4 py-12">
          <FreeTrialBanner />
        </div>
        <CTASection />
      </main>
      <Footer />
      <FreeTrialBanner variant="floating" />
    </div>
  );
};

export default Index;
