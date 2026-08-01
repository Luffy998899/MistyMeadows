import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/LoginForm";
import { PeakMark } from "@/components/PeakMark";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper-warm px-5 py-16">
      <div className="w-full max-w-sm">
        <PeakMark className="h-8 w-auto text-green" />
        <h1 className="text-h2 mt-6">Resort admin</h1>
        <p className="mt-2 text-sm text-stone">
          Sign in to manage rooms, photographs, offers and enquiries.
        </p>

        {configured ? (
          <Suspense fallback={<div className="mt-8 h-64" />}>
            <LoginForm />
          </Suspense>
        ) : (
          <div className="mt-8 border-l-2 border-burgundy bg-paper p-5">
            <h2 className="font-display text-[1.125rem]">Not connected yet</h2>
            <p className="mt-2 text-sm text-stone">
              Supabase environment variables are missing, so there is nothing to
              sign in to. Follow the setup steps in <code>README.md</code>, then
              reload this page.
            </p>
          </div>
        )}

        <Link href="/" className="link-underline mt-8 inline-block text-sm text-stone">
          ← Back to the website
        </Link>
      </div>
    </div>
  );
}
