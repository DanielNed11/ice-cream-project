"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#product", label: "Product" },
  { href: "#ingredients", label: "Ingredients" },
  { href: "#nutrition", label: "Nutrition" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  // Only solidify once the hero has genuinely scrolled out of view -- not
  // at some fixed scroll-pixel threshold, which (given the hero is pinned
  // for its scroll-scrub distance) would turn the navbar solid within the
  // first few hundred pixels of scroll and cover the still-playing
  // animation for the rest of the scrub. IntersectionObserver tracks the
  // hero's actual rendered position, which stays "in view" for the whole
  // pin (GSAP keeps it visually in place via a transform) and only goes
  // false once it's truly scrolled past.
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("product");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 z-40 w-full backdrop-blur-md transition-colors duration-300 ${
        pastHero ? "border-b border-white/10 bg-black/90" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <a href="#top" className="font-sans text-lg font-extrabold tracking-[0.15em] text-white">
          NANO
        </a>
        <ul className="hidden gap-8 font-mono text-xs tracking-[0.15em] text-white/70 uppercase sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
