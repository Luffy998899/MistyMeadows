/**
 * The Misty Meadows mark: three peaks, each drawn as three nested chevrons.
 *
 * Rebuilt as vector rather than shipped as a bitmap so it stays crisp, can
 * inherit `currentColor`, and can be reused at small sizes as a structural
 * device (section rules, list bullets, the scroll cue). If the owner uploads
 * an official logo file in the admin panel, that image is used in the header
 * instead and this becomes the fallback.
 */

const BASE_Y = 64;
const HEIGHT = 64;
const SLOPE = 0.78;
const APEXES = [4, 20, 36];
const CENTRES = [53, 129, 205];

function chevron(cx: number, apexY: number): string {
  const run = (HEIGHT - apexY) * SLOPE;
  return `M ${cx - run} ${BASE_Y} L ${cx} ${apexY} L ${cx + run} ${BASE_Y}`;
}

export function PeakMark({
  className,
  strokeWidth = 8.5,
  title,
}: {
  className?: string;
  strokeWidth?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 258 70"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {CENTRES.map((cx) =>
        APEXES.map((apexY) => (
          <path
            key={`${cx}-${apexY}`}
            d={chevron(cx, apexY)}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="miter"
            strokeMiterlimit={6}
          />
        )),
      )}
    </svg>
  );
}

/** Single peak — used inline as a divider glyph and list bullet. */
export function PeakGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" fill="none" className={className} aria-hidden="true">
      {APEXES.map((apexY) => (
        <path
          key={apexY}
          d={chevron(50, apexY)}
          stroke="currentColor"
          strokeWidth={9}
          strokeLinejoin="miter"
          strokeMiterlimit={6}
        />
      ))}
    </svg>
  );
}
