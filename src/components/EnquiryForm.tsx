"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Room } from "@/lib/types";

type State = "idle" | "sending" | "done" | "error";

/**
 * The enquiry form. Pre-selects a room when arriving from a room page
 * (`/contact?room=Luxury Room`) or an offer (`?offer=...`).
 */
export function EnquiryForm({ rooms }: { rooms: Room[] }) {
  const params = useSearchParams();
  const presetRoom = params.get("room") ?? "";
  const presetOffer = params.get("offer");

  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  // Today, as yyyy-mm-dd, so past dates cannot be picked.
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Could not send your enquiry");

      setState("done");
      setMessage(body.message);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="border-t-2 border-green pt-8">
        <h2 className="text-h3 font-display">Enquiry sent</h2>
        <p className="mt-3 text-stone">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border-t-2 border-pine pt-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </div>

        <div>
          <label htmlFor="check_in" className="field-label">
            Check in
          </label>
          <input id="check_in" name="check_in" type="date" min={today} className="field" />
        </div>

        <div>
          <label htmlFor="check_out" className="field-label">
            Check out
          </label>
          <input id="check_out" name="check_out" type="date" min={today} className="field" />
        </div>

        <div>
          <label htmlFor="guests" className="field-label">
            Guests
          </label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            max={60}
            defaultValue={2}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="room_name" className="field-label">
            Room
          </label>
          <select id="room_name" name="room_name" defaultValue={presetRoom} className="field">
            <option value="">No preference</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.name}>
                {room.name}
              </option>
            ))}
            <option value="Long-stay apartment">Long-stay apartment</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="field-label">
            Anything we should know
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            defaultValue={presetOffer ? `I am enquiring about the "${presetOffer}" offer.` : ""}
            className="field resize-y"
          />
        </div>
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {state === "error" ? (
        <p role="alert" className="mt-6 border-l-2 border-burgundy pl-4 text-sm text-burgundy">
          {message}
        </p>
      ) : null}

      <button type="submit" className="btn btn-solid mt-8" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </button>

      <p className="mt-4 text-xs text-stone">
        We use your details only to answer this enquiry.
      </p>
    </form>
  );
}
