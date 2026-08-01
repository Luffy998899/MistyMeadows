import { PeakGlyph } from "./PeakMark";

/**
 * Interior page opener. Sits below the fixed header and keeps the same
 * left-aligned rhythm as the home page rather than switching to a centred
 * banner.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="pt-[72px] md:pt-20">
      <div className="shell pb-10 pt-12 md:pb-14 md:pt-20">
        <div className="peak-rule mb-5">
          <PeakGlyph className="h-3 w-auto shrink-0" />
          <p className="eyebrow whitespace-nowrap">{eyebrow}</p>
        </div>

        <h1 className="text-h1 max-w-3xl">{title}</h1>

        {lead ? <p className="text-lead mt-6 max-w-xl text-stone">{lead}</p> : null}

        {children}
      </div>
    </section>
  );
}
