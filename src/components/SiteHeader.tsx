"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_SPLIT, PRIMARY_NAV, isActive } from "@/lib/nav";
import type { SiteSettings } from "@/lib/types";

import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

/**
 * Two bars, as on the reference.
 *
 * The upper one is a thin green utility strip carrying the phone number,
 * the address line and the social icons; it scrolls away. The lower one is
 * the navigation, and it sticks: the brand lockup is centred with the links
 * split either side of it, and a gold "Book your stay" chip sits at the
 * right-hand end.
 *
 * Below `lg` the split arrangement has nowhere to go, so it collapses to the
 * usual inline logo plus a full-screen panel.
 */
export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the panel on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock scroll behind the mobile panel, and allow Escape to dismiss it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const phone = settings.phones[0];
  const email = settings.emails[0];
  const left = PRIMARY_NAV.slice(0, NAV_SPLIT);
  const right = PRIMARY_NAV.slice(NAV_SPLIT);

  // `shrink-0` matters: without it the nowrap labels are compressed by the
  // flex container at narrow desktop widths and overlap each other.
  const linkClass = (href: string) =>
    `link-underline block shrink-0 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.1em] transition-colors xl:text-[0.75rem] ${
      isActive(pathname, href) ? "font-medium text-wine" : "text-ink/80 hover:text-wine"
    }`;

  return (
    <>
      {/* Utility strip */}
      <div className="on-green hidden lg:block">
        <div className="shell flex h-10 items-center justify-between gap-6 text-[0.75rem]">
          <div className="flex items-center gap-6 text-paper/85">
            {phone ? (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline">
                {phone}
              </a>
            ) : null}
            {email ? (
              <a href={`mailto:${email}`} className="link-underline">
                {email}
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-6">
            <p className="text-paper/70">{settings.address_lines[0]}</p>
            <SocialLinks socials={settings.socials} size="sm" />
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 bg-paper/95 backdrop-blur-sm transition-shadow duration-300 ${
          scrolled || menuOpen
            ? "border-b border-paper-edge shadow-[0_10px_30px_-28px_rgb(8_64_42/0.7)]"
            : "border-b border-paper-edge/50"
        }`}
      >
        {/* Desktop: links · logo · links */}
        <div className="shell hidden items-center gap-6 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <nav aria-label="Primary">
            <ul className="flex items-center justify-end gap-x-5 xl:gap-x-7">
              {left.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={linkClass(item.href)}
                  >
                    {item.short ?? item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Logo settings={settings} className="mx-4 shrink-0 xl:mx-8" />

          <div className="flex items-center justify-between gap-5 xl:gap-7">
            <nav aria-label="Primary, continued">
              <ul className="flex items-center gap-x-5 xl:gap-x-7">
                {right.map((item) => (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className={linkClass(item.href)}
                    >
                      {item.short ?? item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Link
              href="/contact"
              className="btn btn-gold shrink-0 whitespace-nowrap px-4 py-2.5 text-[0.6875rem] xl:px-5 xl:text-[0.75rem]"
            >
              Book your stay
            </Link>
          </div>
        </div>

        {/* Below lg */}
        <div className="shell flex h-[68px] items-center justify-between gap-4 lg:hidden">
          <Logo settings={settings} orientation="inline" />

          <div className="flex items-center gap-2">
            <Link href="/contact" className="btn btn-gold hidden px-4 py-2.5 text-[0.6875rem] sm:inline-flex">
              Book
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="-mr-2 flex h-11 w-11 items-center justify-center text-ink"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.4" />
                ) : (
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.4" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet panel */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="on-green fixed inset-0 z-40 overflow-y-auto pt-[68px] lg:hidden"
      >
        <nav aria-label="Mobile" className="shell py-8">
          <ul className="divide-y divide-paper/15 border-y border-paper/15">
            {PRIMARY_NAV.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-baseline gap-4 py-3.5 font-display text-[1.625rem] text-paper"
                >
                  <span className="text-[0.625rem] tracking-[0.2em] text-gold-light">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/contact" className="btn btn-gold mt-8 w-full">
            Book your stay
          </Link>

          <div className="mt-8 space-y-1 text-sm text-linen">
            {settings.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block py-1">
                {p}
              </a>
            ))}
            {settings.emails.map((e) => (
              <a key={e} href={`mailto:${e}`} className="block py-1">
                {e}
              </a>
            ))}
          </div>

          <SocialLinks socials={settings.socials} className="mt-6" />
        </nav>
      </div>
    </>
  );
}
