import Link from "next/link";

import { FOOTER_SERVICES, PRIMARY_NAV } from "@/lib/nav";
import type { SiteSettings } from "@/lib/types";

import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { SocialLinks } from "./SocialLinks";

/**
 * The footer follows the reference's arrangement — the brand lockup in its
 * own column on the left, "important links" in the middle, and the address
 * with "follow us on" at the right — over a bottom bar carrying the 24-hour
 * number and the copyright.
 *
 * The reference sets this on a pale sage. Here it is the deep green from the
 * logo instead, which lets the mark sit in reverse and gives the page a firm
 * bottom edge; paper text on it clears 11:1.
 */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const phone = settings.phones[0];

  return (
    <footer className="on-green">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          {/* Brand */}
          <div>
            <Logo settings={settings} tone="paper" className="items-start" />

            <p className="mt-6 max-w-xs text-sm leading-relaxed text-paper/70">
              {settings.tagline}. Pine on three sides, the valley on the fourth.
            </p>

            {Object.values(settings.socials).some(Boolean) ? (
              <>
                <h2 className="eyebrow mt-8">Follow us on</h2>
                <SocialLinks socials={settings.socials} className="mt-3" />
              </>
            ) : null}
          </div>

          {/* Links */}
          <div className="grid gap-10 sm:grid-cols-2 lg:block">
            <nav aria-labelledby="footer-explore">
              <h2 id="footer-explore" className="eyebrow mb-4">
                Important links
              </h2>
              <ul className="space-y-2">
                {PRIMARY_NAV.slice(1).map((item) => (
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

            <nav aria-labelledby="footer-services" className="lg:mt-9">
              <h2 id="footer-services" className="eyebrow mb-4">
                At the resort
              </h2>
              <ul className="space-y-2">
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
          </div>

          {/* Location & newsletter */}
          <div>
            <h2 className="eyebrow mb-4">Our location</h2>
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
                  {settings.phones.map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/\s/g, "")}`}
                      className="link-underline block hover:text-paper"
                    >
                      {p}
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
                className="link-underline mt-4 inline-block text-sm text-gold-light"
              >
                Open in Google Maps
              </a>
            ) : null}

            <div className="mt-8 border-t border-paper/15 pt-6">
              <p className="mb-3 text-sm text-paper/70">
                Seasonal offers and news, a few times a year.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — the reference's 24x7 line, kept. */}
      <div className="border-t border-paper/15">
        <div className="shell flex flex-col items-center gap-3 py-6 text-center text-xs text-paper/70 sm:flex-row sm:justify-between sm:text-left">
          <p>{settings.copyright_text}</p>
          {phone ? (
            <p>
              Reservations 24×7 ·{" "}
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline text-gold-light">
                {phone}
              </a>
            </p>
          ) : null}
          <p>{settings.legal_name}</p>
        </div>
      </div>
    </footer>
  );
}
