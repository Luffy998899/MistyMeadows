import { PeakGlyph } from "./PeakMark";

/**
 * Section opener: an eyebrow, the title, and the peak-interrupted rule that
 * runs through the whole site. Left-aligned by default — the page uses real
 * composition rather than a stack of centred blocks.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
    >
      {eyebrow ? (
        <div
          className={`peak-rule mb-5 ${align === "center" ? "justify-center [&::after]:hidden" : ""}`}
        >
          <PeakGlyph className="h-3 w-auto shrink-0" />
          <span className="eyebrow whitespace-nowrap">{eyebrow}</span>
        </div>
      ) : null}

      <Tag className={Tag === "h1" ? "text-h1" : "text-h2"}>{title}</Tag>

      {lead ? (
        <p className={`text-lead mt-5 text-stone ${align === "center" ? "" : "max-w-xl"}`}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}
