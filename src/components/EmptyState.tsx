import { PeakGlyph } from "./PeakMark";

/**
 * Shown when a section has no published rows yet. Says plainly that there is
 * nothing here rather than rendering an empty grid.
 */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-paper-edge py-16 text-center">
      <PeakGlyph className="mx-auto h-6 w-auto text-paper-edge" />
      <p className="mt-5 font-display text-h3">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-stone">{body}</p>
    </div>
  );
}
