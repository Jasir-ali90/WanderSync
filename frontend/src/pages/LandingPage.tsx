import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Faq, Testimonials } from "@/components/landing/Testimonials";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSections } from "@/components/landing/LandingSections";
import { SeasonsSection, SpotsCarousel } from "@/components/landing/LandingShowcase";
import { WelcomeOverlay } from "@/components/landing/WelcomeOverlay";

export default function LandingPage() {
  const [forceShow, setForceShow] = useState(false);

  return (
    <div className="relative">
      <WelcomeOverlay key={String(forceShow)} forceShow={forceShow} onDone={() => setForceShow(false)} />

      {/* Floating VVIP 3D Welcome Trigger */}
      <button
        type="button"
        onClick={() => setForceShow(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-brand-400/40 bg-ink-900/90 px-4 py-2.5 text-xs font-bold text-brand-300 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-brand-300 hover:text-white"
      >
        <Sparkles className="size-4 text-brand-400 animate-spin" />
        <span>3D AI Welcome Buddy</span>
      </button>

      <LandingHero />
      <SpotsCarousel />
      <LandingSections />
      <SeasonsSection />
      <Testimonials />
      <Faq />
    </div>
  );
}
