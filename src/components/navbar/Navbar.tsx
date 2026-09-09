"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  // Below `sm`, the link list is hidden with no other way to reach the
  // lower sections -- this drives a toggleable mobile menu instead.
  const [menuOpen, setMenuOpen] = useState(false);

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
      className={`fixed top-0 z-40 w-full transition-colors duration-300 ${
        pastHero || menuOpen
          ? "border-b border-white/10 bg-black/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
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
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] sm:hidden"
        >
          <span
            className={`h-px w-5 bg-white transition-transform duration-200 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`}
          />
          <span className={`h-px w-5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span
            className={`h-px w-5 bg-white transition-transform duration-200 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`}
          />
        </button>
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden bg-black sm:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 pb-6 font-mono text-sm tracking-[0.15em] text-white/80 uppercase">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-t border-white/10 py-4 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
