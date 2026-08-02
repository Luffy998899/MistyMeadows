import { PeakGlyph } from "./PeakMark";

/**
 * Section opener: a small-caps eyebrow, a gold ornament broken by the logo's
 * peak silhouette, the heading, and an optional lead.
 *
 * Centred by default — the reference opens nearly every band this way, and
 * the alternating image/text rows on the home page each centre their copy
 * within their own half. `start` and `end` exist for the places where the
 * text column is genuinely edge-aligned.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "start" | "center" | "end";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const box =
    align === "center"
      ? "mx-auto max-w-2xl items-center text-center"
      : align === "end"
        ? "ml-auto max-w-2xl items-end text-right"
        : "max-w-2xl items-start";

  return (
    <div className={`flex flex-col ${box} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

      <div
        className={`ornament my-4 ${
          align === "center"
            ? ""
            : align === "end"
              ? "ornament-end w-full max-w-[13rem]"
              : "ornament-start w-full max-w-[13rem]"
        }`}
        aria-hidden="true"
      >
        <PeakGlyph className="h-2.5 w-auto shrink-0" />
      </div>

      <Tag className={Tag === "h1" ? "text-h1" : "text-h2"}>{title}</Tag>

      {lead ? <p className="text-lead mt-5 text-stone">{lead}</p> : null}
    </div>
  );
}
