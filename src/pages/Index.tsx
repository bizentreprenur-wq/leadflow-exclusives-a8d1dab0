import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import LeadGenSection from "@/components/LeadGenSection";
import EmailOutreachSection from "@/components/EmailOutreachSection";
import ChromeExtensionSection from "@/components/ChromeExtensionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhoThisIsForSection from "@/components/WhoThisIsForSection";
import WhyItWorksSection from "@/components/WhyItWorksSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <LeadGenSection />
        <EmailOutreachSection />
        <ChromeExtensionSection />
        <HowItWorksSection />
        <WhoThisIsForSection />
        <WhyItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
