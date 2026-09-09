"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/preloader/Preloader";
import { Navbar } from "@/components/navbar/Navbar";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Hero } from "@/components/hero/Hero";
import { Ingredients } from "@/components/sections/Ingredients";
import { Nutrition } from "@/components/sections/Nutrition";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { ScrollTrigger } from "@/lib/gsap/registerPlugins";
import { randomVariantId, type FlavorId } from "@/lib/variants";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  // Which flavor opens the site -- randomized per visit rather than always
  // banana. Starts null (matching what the server renders) and is resolved
  // in an effect, which only ever runs on the client -- see randomVariantId's
  // own comment for why it can't be picked during the initial render itself.
  // Preloader and Hero both need this SAME value (so the preloader blocks on
  // the flavor Hero is actually about to show), so it's decided once here
  // and passed down, rather than each picking independently.
  const [openingVariantId, setOpeningVariantId] = useState<FlavorId | null>(null);

  useEffect(() => {
    // Must run as a genuine post-mount effect, not during render: the whole
    // point is picking a fresh value per visit on the client, after the
    // static/server-rendered `null` has already matched on both sides.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpeningVariantId(randomVariantId());
  }, []);

  const handlePreloaderDone = () => {
    setLoaded(true);
    // The preloader unlocking scroll and unmounting shifts layout right
    // around here too -- refresh so section-reveal triggers below the
    // fold are measured against the final layout, not a stale one.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  if (!openingVariantId) return null;

  return (
    <>
      <Preloader defaultVariantId={openingVariantId} onDone={handlePreloaderDone} />
      {loaded && <ScrollProgress />}
      <Navbar />
      <main>
        <Hero initialVariantId={openingVariantId} />
        <Ingredients />
        <Nutrition />
        <Reviews />
        <Faq />
      </main>
      <footer className="border-t border-white/10 px-6 py-10 text-center font-mono text-xs tracking-widest text-white/40 uppercase sm:px-10">
        Nano Protein Ice Cream -- portfolio demo
      </footer>
    </>
  );
}
