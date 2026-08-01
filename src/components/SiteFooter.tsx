import Link from "next/link";

import { FOOTER_SERVICES, PRIMARY_NAV } from "@/lib/nav";
import type { SiteSettings } from "@/lib/types";

import { NewsletterForm } from "./NewsletterForm";
import { PeakMark } from "./PeakMark";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="on-pine">
      <div className="shell py-16 md:py-20">
        {/* Signature line — the one place the display face gets to be loud. */}
        <div className="flex flex-col gap-8 border-b border-paper/15 pb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <PeakMark className="h-9 w-auto text-mist" />
            <p className="signature mt-5 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] leading-[1.1] text-paper">
              Rest easy in the hills
            </p>
          </div>

          <div className="w-full max-w-sm">
            <p className="mb-3 text-sm text-mist">
              Seasonal offers and news from the resort, a few times a year.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="eyebrow mb-4">The resort</h2>
            <p className="max-w-xs text-sm leading-relaxed text-paper/70">
              {settings.intro.split(". ").slice(0, 2).join(". ")}.
            </p>
            <SocialLinks socials={settings.socials} className="mt-6" />
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="eyebrow mb-4">
              Explore
            </h2>
            <ul className="space-y-2.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-sm text-paper/75 hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="eyebrow mb-4">
              At the resort
            </h2>
            <ul className="space-y-2.5">
              {FOOTER_SERVICES.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="link-underline text-sm text-paper/75 hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-4">Find us</h2>
            <address className="space-y-4 text-sm not-italic text-paper/75">
              <p className="leading-relaxed">
                {settings.address_lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>

              {settings.phones.length > 0 ? (
                <p>
                  {settings.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="link-underline block hover:text-paper"
                    >
                      {phone}
                    </a>
                  ))}
                </p>
              ) : null}

              {settings.emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="link-underline block hover:text-paper"
                >
                  {email}
                </a>
              ))}
            </address>

            {settings.map_url ? (
              <a
                href={settings.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-4 inline-block text-sm text-mist"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-paper/15 pt-8 text-xs text-paper/55 sm:flex-row sm:items-center sm:justify-between">
          <p>{settings.copyright_text}</p>
          <p>{settings.legal_name}</p>
        </div>
      </div>
    </footer>
  );
}
