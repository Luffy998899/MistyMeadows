"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a media frame and slides the image inside it as the frame crosses
 * the viewport.
 *
 * Reads geometry on a rAF tick driven by scroll rather than per scroll
 * event, and only while the frame is actually on screen — an
 * IntersectionObserver gates the listener so off-screen frames cost nothing.
 * The image is pre-scaled in CSS so the slide never exposes an edge.
 */
export function Parallax({
  children,
  /** Travel in pixels, top of viewport to bottom. Keep it small. */
  distance = 46,
  className = "",
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = false;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;

      // -1 when the frame sits just below the fold, +1 just above it.
      const progress = (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));

      node.style.setProperty("--parallax-y", `${(-clamped * distance).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (!onScreen || frame) return;
      frame = requestAnimationFrame(apply);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) apply();
    });

    observer.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [distance]);

  return (
    <div ref={ref} className={`parallax-media ${className}`}>
      {children}
    </div>
  );
}
