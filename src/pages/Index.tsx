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
import LeadSyncShowcase from "@/components/LeadSyncShowcase";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroSection />
        <SuperAIFeaturesSection />
        <LeadSyncShowcase />
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
