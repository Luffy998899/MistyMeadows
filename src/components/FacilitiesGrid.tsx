import { Icon } from "./Icon";
import { MediaFrame } from "./MediaFrame";
import { Reveal } from "./Reveal";
import type { Facility } from "@/lib/types";

/**
 * Hairline-divided cells rather than filled tiles, so the grid sits on any
 * section ground (paper, sage, sand) without carrying its own background.
 */
export function FacilitiesGrid({ facilities }: { facilities: Facility[] }) {
  if (facilities.length === 0) return null;

  return (
    <ul className="grid border-t border-paper-edge sm:grid-cols-2 lg:grid-cols-4">
      {facilities.map((facility, i) => (
        <Reveal
          as="li"
          key={facility.id}
          delay={i * 90}
          className="border-b border-paper-edge px-0 py-7 sm:px-7 sm:[&:nth-child(odd)]:pl-0 lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0 lg:[&:nth-child(odd)]:pl-7 lg:[&:nth-child(odd)]:first:pl-0"
        >
          {facility.image ? (
            <MediaFrame
              media={facility.image}
              ratio="4 / 3"
              sizes="(max-width: 640px) 100vw, 22vw"
              className="mb-5"
              zoom
            />
          ) : (
            <Icon name={facility.icon} className="h-7 w-7 text-gold" />
          )}
          <h3 className={`text-h3 font-display ${facility.image ? "" : "mt-5"}`}>
            {facility.name}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-stone">{facility.description}</p>
        </Reveal>
      ))}
    </ul>
  );
}
