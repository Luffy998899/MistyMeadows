"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-triggered reveal.
 *
 * One IntersectionObserver per element, disconnected as soon as it fires —
 * elements reveal once and stay revealed, so scrolling back up does not
 * re-animate the page.
 *
 * The hidden state lives behind a `.js-reveal` class added to <html> at
 * runtime, so if JavaScript never runs the content is simply visible rather
 * than stuck at opacity 0. `prefers-reduced-motion` short-circuits the whole
 * thing in CSS.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger, in milliseconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "figure";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("js-reveal");

    const node = ref.current;
    if (!node) return;

    // Reduced motion, or a browser without IntersectionObserver: show the
    // content immediately rather than leaving it stuck at opacity 0.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.setAttribute("data-reveal", "visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-reveal", "visible");
        observer.disconnect();
      },
      // Fire a little before the element reaches the fold, so the movement
      // has finished by the time it is properly in view.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
