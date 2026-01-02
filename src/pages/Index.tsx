import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhatYouGetSection from "@/components/WhatYouGetSection";
import WhoThisIsForSection from "@/components/WhoThisIsForSection";
import WhyItWorksSection from "@/components/WhyItWorksSection";
import AvailabilitySection from "@/components/AvailabilitySection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <WhatYouGetSection />
      <WhoThisIsForSection />
      <WhyItWorksSection />
      <AvailabilitySection />
      <FinalCTASection />
      <Footer />
    </main>
  );
};

export default Index;
