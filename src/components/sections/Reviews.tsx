import { reviews } from "@/lib/content/reviews";
import { getVariant } from "@/lib/variants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="font-mono text-sm tracking-widest text-white/80">
      {"★".repeat(rating)}
      <span className="text-white/25">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function Reviews() {
  return (
    <section id="reviews" className="bg-black px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading eyebrow="Reviews" title="What people are saying." />
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => {
            const variant = getVariant(review.flavor);
            return (
              <Reveal key={review.name} delay={(i % 3) * 0.08}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <Stars rating={review.rating} />
                  <p className="mt-4 text-white/85">&ldquo;{review.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{review.name}</p>
                    <p
                      className="font-mono text-xs tracking-widest uppercase"
                      style={{ color: variant.themeColor }}
                    >
                      {variant.name}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
