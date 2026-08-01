"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PRIMARY_NAV } from "@/lib/nav";
import type { SiteSettings } from "@/lib/types";

import { Logo } from "./Logo";

/**
 * The header always sits on paper — the hero opens on a paper column rather
 * than a full-bleed photograph, so ink-on-paper is the only legible
 * treatment. The only thing scrolling changes is the hairline rule, which
 * appears once the page has moved under it.
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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 bg-paper/95 backdrop-blur-sm transition-colors duration-300 ${
          scrolled || menuOpen ? "border-b border-paper-edge/70" : "border-b border-transparent"
        }`}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-4 md:h-20">
          <Logo settings={settings} tone="ink" />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {PRIMARY_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`link-underline text-[0.8125rem] tracking-wide text-ink/75 transition-colors hover:text-ink ${
                        active ? "font-medium text-ink" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="hidden text-[0.8125rem] tracking-wide text-stone hover:text-ink xl:inline"
              >
                {phone}
              </a>
            ) : null}

            <Link href="/contact" className="btn btn-solid hidden sm:inline-flex">
              Enquire
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="-mr-2 flex h-11 w-11 items-center justify-center text-ink lg:hidden"
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
        className="on-umber fixed inset-0 z-40 overflow-y-auto pt-[72px] lg:hidden"
      >
        <nav aria-label="Mobile" className="shell py-8">
          <ul className="divide-y divide-paper/15 border-y border-paper/15">
            {PRIMARY_NAV.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-baseline gap-4 py-4 font-display text-[1.75rem] text-paper"
                >
                  <span className="text-[0.625rem] tracking-[0.2em] text-linen">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/contact" className="btn btn-outline mt-8 w-full">
            Enquire about a stay
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
        </nav>
      </div>
    </>
  );
}
