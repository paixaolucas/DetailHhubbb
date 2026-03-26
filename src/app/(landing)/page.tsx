import { HeroSection } from "@/components/landing/HeroSection";
import { InfluencerStripSection } from "@/components/landing/InfluencerStripSection";
import { PainSection } from "@/components/landing/PainSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PillarsSection } from "@/components/landing/PillarsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturedCommunitiesSection } from "@/components/landing/FeaturedCommunitiesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { UrgencySection } from "@/components/landing/UrgencySection";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { ObjectionsSection } from "@/components/landing/ObjectionsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <InfluencerStripSection />
      <PainSection />
      <FeaturesSection />
      <PillarsSection />
      <HowItWorksSection />
      <FeaturedCommunitiesSection />
      <PricingSection />
      <UrgencySection />
      <GuaranteeSection />
      <ObjectionsSection />
      <CTASection />
    </>
  );
}
