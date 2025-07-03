import Navbar from "@/components/landingPage/navbar";
import { VertoFaqSection } from "@/components/landingPage/verto-faq-section";
import { VertoFeaturesSection } from "@/components/landingPage/verto-features-section";
import { VertoFinalCtaSection } from "@/components/landingPage/verto-final-cta-section";
import { VertoHeroSection } from "@/components/landingPage/verto-hero-section";
import { VertoHowItWorksSection } from "@/components/landingPage/verto-how-it-works-section";
import { VertoPricingSection } from "@/components/landingPage/verto-pricing-section";
import { VertoSocialProofBar } from "@/components/landingPage/verto-social-proof-bar";
import { VertoTestimonialsSection } from "@/components/landingPage/verto-testimonials-section";
import { VertoUseCasesSection } from "@/components/landingPage/verto-use-cases-section";

export default function Home() {
  return (
    <main className="min-h-screen dark:bg-black">
      <Navbar/>
      <VertoHeroSection />
      {/* <VertoSocialProofBar /> */}
      <VertoHowItWorksSection />
      <VertoFeaturesSection />
      <VertoUseCasesSection />
      <VertoTestimonialsSection />
      {/* <VertoPricingSection /> */}
      <VertoFaqSection />
      <VertoFinalCtaSection />
    </main>
  );
}
