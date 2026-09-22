import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  /** Short phrase set in Playfair Display italic, as on the landing page. */
  accent?: string;
  /** Tints the eyebrow with a flavour themeColor, like the Ingredients cards. */
  accentColor?: string;
  /** Intro copy, matching the max-w-2xl lede under each landing section. */
  children?: ReactNode;
  actions?: ReactNode;
}

/**
 * The store equivalent of `SectionHeading`. The landing page's display voice
 * is Inter 800 with tight tracking -- Playfair italic is reserved for the
 * short accent line underneath (the hero's `taglineAccent`), never the
 * heading itself -- so page titles here follow the same rule.
 */
export function PageHeader({
  eyebrow,
  title,
  accent,
  accentColor,
  children,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pt-16 sm:pt-20">
      <div className="min-w-0">
        <p className="eyebrow" style={accentColor ? { color: accentColor } : undefined}>
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        {accent && <p className="mt-3 font-serif text-lg text-white/70 italic">{accent}</p>}
        {children && <div className="mt-5 max-w-2xl text-white/70">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
