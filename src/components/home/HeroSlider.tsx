"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PeakGlyph } from "@/components/PeakMark";
import type { Media } from "@/lib/types";

const INTERVAL = 6500;

/**
 * The full-bleed opening slider from the reference: a rotating photograph
 * behind a centred eyebrow-and-headline lockup, with arrows on the shoulders
 * and a row of dots underneath.
 *
 * Three things it does that a naive carousel does not:
 *
 *  - the first slide is a `priority` image and the rest are lazy, so the LCP
 *    is one photograph rather than four;
 *  - autoplay stops on hover, on keyboard focus anywhere inside, when the tab
 *    is hidden, and entirely under `prefers-reduced-motion`;
 *  - the slides are a labelled group with polite live updates, and every
 *    inactive slide is `aria-hidden`, so a screen reader reads one headline
 *    rather than four stacked ones.
 */
export function HeroSlider({
  slides,
  eyebrow,
  headline,
  sub,
}: {
  slides: Media[];
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const count = slides.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(id);
  }, [count, paused]);

  // A slider that keeps advancing in a background tab is just wasted work,
  // and it means returning to the tab lands on an arbitrary slide.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <section
      ref={rootRef}
      className="on-photo relative isolate overflow-hidden bg-green-ink"
      aria-label="Misty Meadows Resorts"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className="relative h-[clamp(30rem,78svh,46rem)] w-full"
        role="group"
        aria-roledescription="carousel"
        aria-label="Views of the resort"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
              i === index ? "slide-active opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.public_url}
              alt={slide.alt}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}

        {/*
          Scrim, in two parts.

          A vertical gradient alone was not enough: these photographs run
          from blown-out sky to sunlit foliage, and white type over the
          bright middle of the bougainvillea slide was genuinely hard to
          read. So a centred radial wash sits under the type as well, which
          darkens the area the headline occupies without flattening the
          corners of the picture.
        */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(8_64_42/0.62),rgb(8_64_42/0.42)_45%,rgb(8_64_42/0.78))]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_58%_52%_at_50%_45%,rgb(6_38_25/0.62),transparent_72%)]"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-center">
          <div className="shell flex w-full flex-col items-center pb-20 text-center md:pb-24">
            <p className="eyebrow">{eyebrow}</p>

            <div className="ornament my-5 text-gold" aria-hidden="true">
              <PeakGlyph className="h-3 w-auto shrink-0" />
            </div>

            {/*
              One face, one weight, one colour. The gold script accent that
              was here before lost too much contrast against the sunlit parts
              of the photographs — at display size the swash strokes are
              thin, and thin gold on bright foliage is unreadable whatever
              the scrim does. The emphasis now comes from an italic of the
              same serif, still in paper white.
            */}
            <h1 className="text-display max-w-4xl font-display font-medium leading-[1.06] text-paper [text-shadow:0_2px_6px_rgb(6_38_25/0.55),0_8px_32px_rgb(6_38_25/0.45)]">
              {headline}
            </h1>

            <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-paper [text-shadow:0_1px_10px_rgb(6_38_25/0.7)] md:text-base">
              {sub}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/rooms" className="btn btn-gold">
                View our rooms
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Enquire about a stay
              </Link>
            </div>
          </div>
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/40 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-green-ink md:left-6"
            >
              <span className="sr-only">Previous slide</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-paper/40 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-green-ink md:right-6"
            >
              <span className="sr-only">Next slide</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === index ? "w-7 bg-gold" : "w-2 bg-paper/50 hover:bg-paper/80"
                  }`}
                >
                  <span className="sr-only">Slide {i + 1}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* What assistive tech is told when the slide changes. */}
      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}: {slides[index]?.alt}
      </p>
    </section>
  );
}
