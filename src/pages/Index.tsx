import HeroSection from "@/components/HeroSection";
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
    <main className="min-h-screen bg-background">
      <HeroSection />
      <WhatSearchDoesSection />
      <WhyThisMattersSection />
      <ResultsPreviewSection />
      <FiltersSection />
      <WhoThisIsForSection />
      <HowAccessWorksSection />
      <WhyItWorksSection />
      <FreeTrialSection />
      <BottomSearchSection />
      <Footer />
    </main>
  );
};

export default Index;
