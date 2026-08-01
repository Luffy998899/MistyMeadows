import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().trim().email("That email address does not look right").max(200),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your email address" },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "The newsletter is not connected yet." },
      { status: 503 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscribers")
    .upsert({ email: parsed.data.email.toLowerCase() }, { onConflict: "email" });

  if (error) {
    console.error(`[newsletter] subscribe failed: ${error.message}`);
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "You are on the list." });
}
