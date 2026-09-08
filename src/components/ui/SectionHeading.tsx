interface SectionHeadingProps {
  eyebrow: string;
  title: string;
}

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="mb-12">
      <p className="font-mono text-xs tracking-[0.3em] text-white/50 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h2>
    </div>
  );
}
