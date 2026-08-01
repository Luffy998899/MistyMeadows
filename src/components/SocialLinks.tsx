import type { Socials } from "@/lib/types";

const PATHS: Record<string, string> = {
  facebook:
    "M14 9h2.5V6.2H14c-2 0-3.4 1.4-3.4 3.4V11H8.6v2.8h2V21h2.8v-7.2h2.2l.4-2.8h-2.6V9.7c0-.5.3-.7.6-.7Z",
  instagram:
    "M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 7.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Zm5.6-7.4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.4 4h7.2A4.4 4.4 0 0 1 20 8.4v7.2a4.4 4.4 0 0 1-4.4 4.4H8.4A4.4 4.4 0 0 1 4 15.6V8.4A4.4 4.4 0 0 1 8.4 4Zm0 1.7A2.7 2.7 0 0 0 5.7 8.4v7.2a2.7 2.7 0 0 0 2.7 2.7h7.2a2.7 2.7 0 0 0 2.7-2.7V8.4a2.7 2.7 0 0 0-2.7-2.7Z",
  twitter:
    "M17.2 5h2.6l-5.7 6.5 6.7 8.5h-5.3l-4.1-5.2-4.7 5.2H4l6.1-6.9L3.7 5H9l3.7 4.8Zm-.9 13.4h1.4L8.4 6.5H6.9Z",
  youtube:
    "M21.2 8.4a2.4 2.4 0 0 0-1.7-1.7C18 6.3 12 6.3 12 6.3s-6 0-7.5.4a2.4 2.4 0 0 0-1.7 1.7C2.4 9.9 2.4 12 2.4 12s0 2.1.4 3.6a2.4 2.4 0 0 0 1.7 1.7c1.5.4 7.5.4 7.5.4s6 0 7.5-.4a2.4 2.4 0 0 0 1.7-1.7c.4-1.5.4-3.6.4-3.6s0-2.1-.4-3.6ZM10.1 14.9V9.1l5 2.9Z",
  linkedin:
    "M7.1 9.3H4.4V20h2.7Zm.2-3a1.6 1.6 0 1 0-3.2 0 1.6 1.6 0 0 0 3.2 0ZM20 13.9c0-3-1.6-4.4-3.7-4.4a3.2 3.2 0 0 0-2.9 1.6V9.3H10.7V20h2.7v-5.6c0-1.5.3-2.9 2.1-2.9s1.8 1.6 1.8 3V20H20Z",
  tripadvisor:
    "M12 8.2c-1.9-1.3-4.2-2-6.9-2L3 8.6a4.6 4.6 0 1 0 6 6.9l1 1.4 1-1.4a4.6 4.6 0 1 0 6-6.9l-2.1-2.4c-1 0-1.9.1-2.9.3Zm-4.4 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8.8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm-8.8-4.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm8.8 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z",
};

const LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tripadvisor: "Tripadvisor",
};

/**
 * Renders only the networks the owner has actually filled in, so an empty
 * settings row produces no dead icons.
 */
export function SocialLinks({
  socials,
  className = "",
}: {
  socials: Socials;
  className?: string;
}) {
  const entries = Object.entries(socials).filter(
    ([key, url]) => Boolean(url?.trim()) && key in PATHS,
  );

  if (entries.length === 0) return null;

  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {entries.map(([key, url]) => (
        <li key={key}>
          <a
            href={url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center border border-paper/25 text-paper/80 transition-colors hover:border-paper hover:text-paper"
          >
            <span className="sr-only">{LABELS[key] ?? key}</span>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d={PATHS[key]} fill="currentColor" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
