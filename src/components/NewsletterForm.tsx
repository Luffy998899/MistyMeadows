"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();

      if (!response.ok) throw new Error(body.error ?? "Could not subscribe");

      setState("done");
      setMessage(body.message ?? "You are on the list.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-sm text-mist">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor="newsletter-email" className="field-label text-mist">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field flex-1 border-paper/30 text-paper placeholder:text-paper/40"
        />
        <button type="submit" className="btn btn-outline" disabled={state === "sending"}>
          {state === "sending" ? "Adding…" : "Subscribe"}
        </button>
      </div>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-sm text-mist">
          {message}
        </p>
      ) : null}
    </form>
  );
}
