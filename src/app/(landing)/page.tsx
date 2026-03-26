import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PillarsSection } from "@/components/landing/PillarsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { ObjectionsSection } from "@/components/landing/ObjectionsSection";
import { UrgencySection } from "@/components/landing/UrgencySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FeaturedCommunitiesSection } from "@/components/landing/FeaturedCommunitiesSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PainSection />
      <HowItWorksSection />
      <PillarsSection />
      <PricingSection />
      <GuaranteeSection />
      <ObjectionsSection />
      <UrgencySection />
      <TestimonialsSection />
      <FeaturedCommunitiesSection />
      <CTASection />
    </>
  );
}
