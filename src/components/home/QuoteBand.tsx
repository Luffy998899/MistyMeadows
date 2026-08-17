import { PeakGlyph } from "@/components/PeakMark";
import { Reveal } from "@/components/Reveal";

/**
 * The pale centred statement the reference drops between its rooms band and
 * its banquet band — a breath in the page rather than another sell.
 *
 * The peaks are repeated large and faint behind the type, which is where the
 * reference puts its watermark mountain shapes.
 */
export function QuoteBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="on-mint section-tight relative isolate overflow-hidden">
      <PeakGlyph
        className="pointer-events-none absolute -left-10 top-1/2 h-40 w-auto -translate-y-1/2 text-green/[0.07]"
      />
      <PeakGlyph
        className="pointer-events-none absolute -right-10 top-1/2 h-40 w-auto -translate-y-1/2 text-green/[0.07]"
      />

      <Reveal className="shell">
        <p className="mx-auto max-w-3xl text-center font-display text-[clamp(1.375rem,1.1rem+1.2vw,2rem)] leading-[1.5] text-green-deep">
          {children}
        </p>
      </Reveal>
    </section>
  );
}
