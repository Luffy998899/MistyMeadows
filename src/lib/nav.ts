export type NavItem = { href: string; label: string };

/** Mirrors the sections the resort actually has — no placeholder pages. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/rooms", label: "Rooms & Suites" },
  { href: "/dining", label: "Dining" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/offers", label: "Offers" },
  { href: "/journal", label: "News & Events" },
  { href: "/about", label: "About" },
];

export const FOOTER_SERVICES: NavItem[] = [
  { href: "/dining", label: "Multi-cuisine restaurant" },
  { href: "/rooms", label: "Rooms & suites" },
  { href: "/rooms#apartments", label: "Long-stay apartments" },
  { href: "/facilities", label: "Conference & events" },
  { href: "/facilities", label: "Clubhouse & games" },
  { href: "/about#location", label: "Getting here" },
];
