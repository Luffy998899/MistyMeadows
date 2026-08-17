"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Offer } from "@/lib/types";

import { PeakGlyph } from "./PeakMark";

/** How long after load the panel appears. Long enough not to be a jump-scare. */
const DELAY = 1400;

const STORAGE_KEY = "mm:offer-dismissed";

/**
 * The current offer, announced in a panel over the site.
 *
 * Deliberate behaviours, in rough order of how annoying they would be to get
 * wrong:
 *
 *  - **It stays closed.** The dismissal is stored against the offer's slug
 *    *and* its `announce_version`, so closing it means closing it — until the
 *    owner publishes a different offer or bumps the version, which is how
 *    they reach guests who dismissed the last one.
 *  - **It never blocks a first paint.** It mounts hidden and appears after a
 *    beat, so it is not competing with the hero for attention or for layout.
 *  - **It is a real dialog.** Focus moves into it, Escape closes it, focus
 *    returns to where it was, and focus is trapped while it is open — a modal
 *    a keyboard user cannot leave is worse than no modal.
 *  - **`localStorage` may throw.** Safari in private mode does exactly that,
 *    so every access is guarded; the fallback is simply to show the panel.
 */
export function OfferAnnouncement({ offer }: { offer: Offer }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<Element | null>(null);

  const token = `${offer.slug}:${offer.announce_version}`;

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Storage unavailable — the panel will simply appear again next visit.
    }
  }, [token]);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === token;
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    // Respect a guest who would rather nothing moved: still show it, just
    // without waiting for an animation that will not play.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setOpen(true), reduced ? 0 : DELAY);
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (!open) return;

    returnFocusTo.current = document.activeElement;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep Tab inside the panel.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-announcement-title"
    >
      {/* Backdrop. Clicking it closes, same as the button. */}
      <button
        type="button"
        aria-label="Close offer"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-green-ink/70 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        className="rise relative w-full max-w-3xl overflow-hidden bg-paper shadow-[0_40px_120px_-40px_rgb(8_64_42/0.8)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          className="absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center text-ink/70 transition-colors hover:text-wine md:right-2 md:top-2"
        >
          <span className="sr-only">Close</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          {offer.image?.public_url ? (
            <div className="relative hidden min-h-[16rem] sm:block">
              <Image
                src={offer.image.public_url}
                alt={offer.image.alt || offer.title}
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="px-6 py-9 text-center sm:px-9 sm:text-left">
            <p className="eyebrow">Current offer</p>

            <div className="ornament my-3.5 justify-center text-gold" aria-hidden="true">
              <PeakGlyph className="h-2.5 w-auto shrink-0" />
            </div>

            <h2
              id="offer-announcement-title"
              className="font-display text-[clamp(1.5rem,1.2rem+1vw,2.125rem)] leading-tight"
            >
              {offer.title}
            </h2>

            {offer.summary ? (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-stone">{offer.summary}</p>
            ) : null}

            {offer.valid_to ? (
              <p className="mt-3 text-sm text-wine">
                Until{" "}
                {new Date(offer.valid_to).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                href={`/contact?offer=${encodeURIComponent(offer.title)}`}
                className="btn btn-solid"
                onClick={dismiss}
              >
                Enquire about it
              </Link>
              <Link href="/offers" className="btn btn-outline" onClick={dismiss}>
                All offers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
