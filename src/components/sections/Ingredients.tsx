import Image from "next/image";
import { variants } from "@/lib/variants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export function Ingredients() {
  return (
    <section id="ingredients" className="bg-black px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading eyebrow="Ingredients" title="Real ingredients. No filler." />
          <p className="max-w-2xl text-white/70">
            Every batch starts with real, whole ingredients -- no gums, no mystery protein blends, nothing
            you can&apos;t picture in your kitchen.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {variants.map((variant, i) => (
            <Reveal key={variant.id} delay={i * 0.1}>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={variant.lifestyleImageSrc}
                    alt={`${variant.name} tub with real ingredients`}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="font-mono text-xs tracking-[0.25em] uppercase" style={{ color: variant.themeColor }}>
                    {String(variant.index).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">{variant.name}</h3>
                  <ul className="mt-4 space-y-1 text-sm text-white/70">
                    {variant.ingredients.map((ingredient) => (
                      <li key={ingredient}>{ingredient}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-white/50">{variant.ingredientNote}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
