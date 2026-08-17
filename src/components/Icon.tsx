/**
 * A small, deliberately plain line-icon set — one stroke weight, one grid.
 * Used only where an icon adds meaning (facility types); everything else
 * relies on type and rules.
 */
const PATHS: Record<string, string> = {
  dining:
    "M6 3v8a2 2 0 0 0 4 0V3M8 11v10M18 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9",
  conference:
    "M3 8h18M5 8V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2M4 8v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8M9 18v3M15 18v3",
  clubhouse:
    "M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12",
  parking:
    "M6 20V4h6a4.5 4.5 0 0 1 0 9H6",
  spa: "M12 21c0-5 3-9 8-10-1 5-4 8-8 10ZM12 21c0-5-3-9-8-10 1 5 4 8 8 10ZM12 21v-6",
  wifi: "M2.5 9a15 15 0 0 1 19 0M6 12.5a10 10 0 0 1 12 0M9.5 16a5 5 0 0 1 5 0M12 19.5h.01",
  peak: "M3 19 9 8l3.5 6.5L15 10l6 9Z",
  tag: "M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-8.6 8.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7ZM7.5 7.5h.01",
  rate: "M12 3v18M16.5 7.2A3.6 3.6 0 0 0 13 5h-2a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-2a3.6 3.6 0 0 1-3.5-2.2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.2 1.9",
  calendar:
    "M3 9h18M7 3v3M17 3v3M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM9 14l2 2 4-4",
  view: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  bed: "M3 18v-8h13a4 4 0 0 1 4 4v4M3 18h18M3 14h17M6.5 10V7h5v3",
};

export function Icon({
  name,
  className = "h-6 w-6",
}: {
  name: string;
  className?: string;
}) {
  const d = PATHS[name] ?? PATHS.peak;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
