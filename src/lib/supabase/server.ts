import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Request-scoped client that carries the signed-in user's session, so every
 * query runs under RLS as that user. Use this everywhere except the few
 * places that genuinely need to bypass RLS (see `admin.ts`).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session, so this is safe to swallow.
        }
      },
    },
  });
}
