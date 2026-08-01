import { Icon } from "./Icon";
import type { Facility } from "@/lib/types";

export function FacilitiesGrid({ facilities }: { facilities: Facility[] }) {
  if (facilities.length === 0) return null;

  return (
    <ul className="grid gap-px bg-paper-edge sm:grid-cols-2 lg:grid-cols-4">
      {facilities.map((facility) => (
        <li key={facility.id} className="bg-paper p-7 md:p-8">
          <Icon name={facility.icon} className="h-7 w-7 text-green" />
          <h3 className="text-h3 mt-5 font-display">{facility.name}</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-stone">{facility.description}</p>
        </li>
      ))}
    </ul>
  );
}
