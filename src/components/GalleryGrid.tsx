"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GalleryItem } from "@/lib/types";

/**
 * The gallery: an even tile field with a lightbox behind it.
 *
 * Two things this replaces, both of which were the problem with the previous
 * layout:
 *
 *  - **Even tiles.** Promoting every fifth image to double width produced a
 *    ragged grid full of holes as soon as the number of photographs in a
 *    category was not a multiple of the pattern. Every tile is now the same
 *    square, so any number of photographs fills cleanly and the pictures —
 *    which vary wildly in shape — are all cropped the same way.
 *  - **They open.** A thumbnail that cannot be enlarged is not a gallery.
 *    Clicking one opens it full size, with the arrow keys and swipe to move
 *    between them.
 *
 * Filtering is client-side over an already-loaded list: nineteen thumbnails
 * is not enough data to be worth a round trip, and it keeps the filter
 * instant.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [category, setCategory] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<Element | null>(null);
  const touchStartX = useRef<number | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items],
  );

  const shown = useMemo(
    () => (category === "all" ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  const open = openIndex !== null ? shown[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) => {
        if (current === null || shown.length === 0) return current;
        // Wrap, so the last "next" returns to the first rather than dead-ending.
        return (current + delta + shown.length) % shown.length;
      }),
    [shown.length],
  );

  // Changing the filter while the lightbox is open would leave the index
  // pointing at a different photograph, or past the end of the list.
  useEffect(() => {
    setOpenIndex(null);
  }, [category]);

  useEffect(() => {
    if (openIndex === null) return;

    returnFocusTo.current = document.activeElement;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]',
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
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [openIndex, close, step]);

  if (items.length === 0) return null;

  return (
    <>
      {categories.length > 1 ? (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {["all", ...categories].map((value) => {
            const active = category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                aria-pressed={active}
                className={`border px-4 py-2 text-[0.75rem] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-green-ink bg-green-ink text-paper"
                    : "border-paper-edge text-stone hover:border-gold hover:text-wine"
                }`}
              >
                {value === "all" ? `All (${items.length})` : value}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="media-frame media-zoom group relative block aspect-square w-full"
            >
              {item.media?.public_url ? (
                item.media.kind === "video" ? (
                  <video
                    src={item.media.public_url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={item.media.public_url}
                    alt={item.media.alt || item.caption || ""}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover"
                  />
                )
              ) : null}

              {/* A hint that the tile does something, without a permanent scrim. */}
              <span
                className="absolute inset-0 bg-green-ink/0 transition-colors group-hover:bg-green-ink/25"
                aria-hidden="true"
              />
              <span className="sr-only">
                {item.caption || item.media?.alt || "Open photograph"} — open larger
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[70] flex flex-col bg-green-ink/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || open.media?.alt || "Photograph"}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            const end = e.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start === null || end === undefined) return;
            // Ignore anything short enough to be a tap or a scroll.
            if (Math.abs(end - start) < 50) return;
            step(end < start ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-paper sm:px-6">
            <p className="text-[0.75rem] tracking-[0.16em] text-paper/70">
              {openIndex! + 1} / {shown.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center text-paper transition-colors hover:text-gold-light"
            >
              <span className="sr-only">Close</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            {shown.length > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                className="absolute left-1 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-paper/40 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-green-ink sm:left-4"
              >
                <span className="sr-only">Previous photograph</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            ) : null}

            {/*
              `contain`, not `cover`: this is the one place a guest wants the
              whole photograph, and these vary from panoramas to portraits.
            */}
            <div className="relative h-full w-full">
              {open.media?.public_url ? (
                open.media.kind === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    src={open.media.public_url}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                    aria-label={open.caption || open.media.alt || "Video"}
                  />
                ) : (
                  <Image
                    key={open.id}
                    src={open.media.public_url}
                    alt={open.media.alt || open.caption || ""}
                    fill
                    sizes="100vw"
                    priority
                    className="object-contain"
                  />
                )
              ) : null}
            </div>

            {shown.length > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                className="absolute right-1 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-paper/40 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-green-ink sm:right-4"
              >
                <span className="sr-only">Next photograph</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="px-6 py-5 text-center">
            {open.caption ? (
              <p className="font-display text-[1.125rem] text-paper">{open.caption}</p>
            ) : null}
            {open.category ? (
              <p className="eyebrow mt-1.5 text-gold-light">{open.category}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
