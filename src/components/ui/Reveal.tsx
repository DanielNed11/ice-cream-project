"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { registerGsapPlugins, gsap } from "@/lib/gsap/registerPlugins";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Shared GSAP ScrollTrigger reveal used by every lower section, so all
// scroll-position-driven animation stays on one engine (see animation
// system boundaries in the project plan). Under prefers-reduced-motion the
// tween is skipped entirely, leaving children in their natural final state.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  registerGsapPlugins();

  useGSAP(
    () => {
      if (reducedMotion || !ref.current) return;
      gsap.from(ref.current, {
        opacity: 0,
        y: 16,
        duration: 0.6,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
