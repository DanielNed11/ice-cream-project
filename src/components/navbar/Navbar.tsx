"use client";

import { motion, useScroll, useTransform } from "framer-motion";

const links = [
  { href: "#product", label: "Product" },
  { href: "#ingredients", label: "Ingredients" },
  { href: "#nutrition", label: "Nutrition" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 400], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 400], [0, 0.1]);

  return (
    <motion.header
      className="fixed top-0 z-40 w-full backdrop-blur-md"
      style={{
        backgroundColor: useTransform(backgroundOpacity, (v) => `rgba(0,0,0,${v})`),
        borderBottom: useTransform(borderOpacity, (v) => `1px solid rgba(255,255,255,${v})`),
      }}
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
    </motion.header>
  );
}
