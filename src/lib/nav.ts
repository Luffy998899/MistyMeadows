/** `short` is what the header shows; `label` is used everywhere else. */
export type NavItem = { href: string; label: string; short?: string };

/**
 * Mirrors the sections the resort actually has — no placeholder pages.
 *
 * The header splits this list either side of the centred logo, which is why
 * the order matters: the first half sits to the left of the mark, the rest to
 * its right. `NAV_SPLIT` is where the cut falls.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/rooms", label: "Rooms & Suites", short: "Rooms" },
  { href: "/dining", label: "Dining" },
  { href: "/facilities", label: "Facilities" },
  { href: "/attractions", label: "Attractions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export const NAV_SPLIT = 4;

/**
 * Not in the header, but linked from the footer and the mobile panel so
 * neither page is orphaned.
 *
 * Offers are off the menu on purpose: a current offer announces itself in a
 * panel over the site instead (see `OfferAnnouncement`), which is worth more
 * than a link most guests never click. The page stays for the panel and the
 * footer to link to.
 */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/offers", label: "Offers" },
  { href: "/journal", label: "News & Events" },
];

export const FOOTER_SERVICES: NavItem[] = [
  { href: "/attractions", label: "Things to see nearby" },
  { href: "/rooms", label: "Rooms & suites" },
  { href: "/rooms#apartments", label: "Long-stay apartments" },
  { href: "/dining", label: "Multi-cuisine restaurant" },
  { href: "/dining#picnics", label: "Day picnics" },
  { href: "/facilities#events", label: "Banquets & celebrations" },
  { href: "/facilities", label: "Conference & clubhouse" },
  { href: "/about#location", label: "Getting here" },
];

/**
 * `/` would otherwise prefix-match every route and light up "Home" on every
 * page, so the root is compared exactly and everything else by prefix.
 */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
