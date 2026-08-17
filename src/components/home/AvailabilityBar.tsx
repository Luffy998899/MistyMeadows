"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * The check-in / check-out / guests bar that the reference lays over the
 * bottom edge of its hero.
 *
 * It is deliberately not a booking engine: the resort takes reservations by
 * phone and email, so this collects the three things worth knowing and hands
 * them to the enquiry form as query parameters. That is honest about what
 * happens next, and it still saves the guest from re-typing their dates.
 */
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function AvailabilityBar() {
  const router = useRouter();

  // Computed once on mount rather than during render, so the server and the
  // first client render agree on the markup.
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const today = useMemo(() => isoDate(0), []);
  // Check-out can never be on or before check-in.
  const minOut = checkIn || today;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`/contact?${params.toString()}`);
  }

  return (
    <div className="shell relative z-10 -mt-14 md:-mt-16">
      <form
        onSubmit={onSubmit}
        className="grid gap-px overflow-hidden bg-paper-edge shadow-[0_28px_60px_-40px_rgb(8_64_42/0.75)] sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
        aria-label="Check availability"
      >
        <div className="bg-paper px-5 py-4">
          <label htmlFor="avail-in" className="field-label mb-1">
            Check in
          </label>
          <input
            id="avail-in"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut("");
            }}
            className="w-full border-0 bg-transparent p-0 font-display text-[1.375rem] leading-tight text-ink focus:outline-none"
          />
        </div>

        <div className="bg-paper px-5 py-4">
          <label htmlFor="avail-out" className="field-label mb-1">
            Check out
          </label>
          <input
            id="avail-out"
            type="date"
            min={minOut}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full border-0 bg-transparent p-0 font-display text-[1.375rem] leading-tight text-ink focus:outline-none"
          />
        </div>

        <div className="bg-paper px-5 py-4">
          <label htmlFor="avail-guests" className="field-label mb-1">
            Guests
          </label>
          <input
            id="avail-guests"
            type="number"
            min={1}
            max={60}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full border-0 bg-transparent p-0 font-display text-[1.375rem] leading-tight text-ink focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="btn btn-solid h-full min-h-[64px] rounded-none px-8 sm:col-span-2 lg:col-span-1"
        >
          Check availability
        </button>
      </form>
    </div>
  );
}
