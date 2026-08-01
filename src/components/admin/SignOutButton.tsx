"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.refresh();
        router.replace("/admin/login");
      }}
      className="link-underline text-xs text-bark"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
