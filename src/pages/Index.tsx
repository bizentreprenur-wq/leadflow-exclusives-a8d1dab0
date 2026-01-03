import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AgentCardsSection from "@/components/AgentCardsSection";
import WhatSearchDoesSection from "@/components/WhatSearchDoesSection";
import WhyThisMattersSection from "@/components/WhyThisMattersSection";
import ResultsPreviewSection from "@/components/ResultsPreviewSection";
import FiltersSection from "@/components/FiltersSection";
import WhoThisIsForSection from "@/components/WhoThisIsForSection";
import HowAccessWorksSection from "@/components/HowAccessWorksSection";
import WhyItWorksSection from "@/components/WhyItWorksSection";
import FreeTrialSection from "@/components/FreeTrialSection";
import BottomSearchSection from "@/components/BottomSearchSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main>
        <HeroSection />
        <AgentCardsSection />
        <WhatSearchDoesSection />
        <WhyThisMattersSection />
        <ResultsPreviewSection />
        <FiltersSection />
        <WhoThisIsForSection />
        <HowAccessWorksSection />
        <WhyItWorksSection />
        <FreeTrialSection />
        <BottomSearchSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
