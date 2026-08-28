import { Faq, Testimonials } from "@/components/landing/Testimonials";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSections } from "@/components/landing/LandingSections";
import { SeasonsSection, SpotsCarousel } from "@/components/landing/LandingShowcase";

export default function LandingPage() {
  return (
    <div className="relative">
      <LandingHero />
      <SpotsCarousel />
      <LandingSections />
      <SeasonsSection />
      <Testimonials />
      <Faq />
    </div>
  );
}
