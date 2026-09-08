"use client";

import { useState } from "react";
import { Preloader } from "@/components/preloader/Preloader";
import { Navbar } from "@/components/navbar/Navbar";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Hero } from "@/components/hero/Hero";
import { Ingredients } from "@/components/sections/Ingredients";
import { Nutrition } from "@/components/sections/Nutrition";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { ScrollTrigger } from "@/lib/gsap/registerPlugins";

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  const handlePreloaderDone = () => {
    setLoaded(true);
    // The preloader unlocking scroll and unmounting shifts layout right
    // around here too -- refresh so section-reveal triggers below the
    // fold are measured against the final layout, not a stale one.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  return (
    <>
      <Preloader onDone={handlePreloaderDone} />
      {loaded && <ScrollProgress />}
      <Navbar />
      <main>
        <Hero />
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
