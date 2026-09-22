"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";

export const NAVBAR_HEIGHT_CLASS = "pt-[4.5rem]";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { itemCount } = useCart();

  const isLanding = pathname === "/";

  // Only the landing page has a hero to sit transparently over. Everywhere
  // else the bar is solid from the first pixel, otherwise white links land on
  // whatever the page happens to render underneath them.
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only solidify once the hero has genuinely scrolled out of view -- not at
  // some fixed scroll-pixel threshold, which (given the hero is pinned for its
  // scroll-scrub distance) would turn the navbar solid within the first few
  // hundred pixels and cover the still-playing animation for the rest of the
  // scrub. IntersectionObserver tracks the hero's actual rendered position.
  useEffect(() => {
    if (!isLanding) return;

    let heroObserver: IntersectionObserver | null = null;

    function watchHero(hero: Element) {
      heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), {
        threshold: 0,
      });
      heroObserver.observe(hero);
    }

    const hero = document.getElementById("product");
    if (hero) {
      watchHero(hero);
      return () => heroObserver?.disconnect();
    }

    // The navbar lives in the root layout, so it mounts before the landing
    // page has chosen an opening flavour and rendered its hero. Without this
    // the observer would never attach and the bar would stay transparent over
    // every section below the fold.
    const heroAdded = new MutationObserver(() => {
      const lateHero = document.getElementById("product");
      if (!lateHero) return;
      heroAdded.disconnect();
      watchHero(lateHero);
    });
    heroAdded.observe(document.body, { childList: true, subtree: true });

    return () => {
      heroAdded.disconnect();
      heroObserver?.disconnect();
    };
  }, [isLanding]);

  const solid = !isLanding || pastHero || menuOpen;

  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "Account" : "Sign in";
  // Staff only: customers never see a link they would be bounced off.
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const menuEntries: { href: Route; label: string }[] = [
    ...(isStaff ? [{ href: "/admin" as Route, label: "Admin" }] : []),
    { href: "/shop", label: "Shop" },
    { href: "/cart", label: itemCount > 0 ? `Cart (${itemCount})` : "Cart" },
    { href: accountHref, label: accountLabel },
  ];

  const focusRing =
    "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
  const navLink = `font-mono text-xs tracking-[0.15em] text-white/70 uppercase transition-colors hover:text-white ${focusRing}`;

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-colors duration-300 ${
        solid
          ? "border-b border-white/10 bg-black/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-6 sm:px-10"
      >
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className={`font-sans text-lg font-extrabold tracking-[0.15em] text-white ${focusRing}`}
        >
          NANO
        </Link>

        {/* Rendered only once the session is known, so a signed in visitor
            never sees "Sign in" flash before their name resolves. */}
        <div className="hidden items-center gap-8 sm:flex">
          <Link href="/shop" className={navLink}>
            Shop
          </Link>

          {!loading && (
            <>
              {isStaff && (
                <Link href="/admin" className={navLink}>
                  Admin
                </Link>
              )}

              <Link href="/cart" className={navLink}>
                Cart
                {itemCount > 0 && (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 font-sans text-[0.65rem] text-black">
                    {itemCount}
                  </span>
                )}
              </Link>

              <Link href={accountHref} className={navLink}>
                {accountLabel}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenuOpen(false);
          }}
          // 44px square: the minimum comfortable touch target.
          className={`-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] sm:hidden ${focusRing}`}
        >
          <span
            className={`h-px w-5 bg-white transition-transform duration-200 ${menuOpen ? "translate-y-[3px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-white transition-transform duration-200 ${menuOpen ? "-translate-y-[3px] -rotate-45" : ""}`}
          />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
            id="mobile-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenuOpen(false);
            }}
            className="overflow-hidden bg-black sm:hidden"
          >
            {menuEntries.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => setMenuOpen(false)}
                className={`block border-t border-white/10 px-6 py-4 font-mono text-sm tracking-[0.15em] text-white uppercase ${focusRing}`}
              >
                {entry.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
