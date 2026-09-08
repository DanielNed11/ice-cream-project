import { variants } from "@/lib/variants";
import { nutritionFootnote, proteinSourceNote } from "@/lib/content/nutrition";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export function Nutrition() {
  return (
    <section id="nutrition" className="bg-black px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading eyebrow="Nutrition" title="The numbers, straight up." />
          <p className="max-w-2xl text-white/70">{proteinSourceNote}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                <p className="font-mono text-xs tracking-[0.25em] text-white/50 uppercase">{variant.name}</p>
                <p className="mt-4 font-mono text-6xl font-bold" style={{ color: variant.themeColor }}>
                  {variant.nutrition.proteinG}g
                </p>
                <p className="mt-1 text-sm text-white/50">protein per {variant.nutrition.servingSize}</p>
                <p className="mt-6 font-mono text-2xl text-white/80">
                  {variant.nutrition.caloriesPerServing !== null ? `${variant.nutrition.caloriesPerServing} cal` : "--"}
                </p>
                <p className="text-sm text-white/50">calories per {variant.nutrition.servingSize}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 max-w-2xl text-xs text-white/40">{nutritionFootnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
