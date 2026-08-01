import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceKey, supabaseUrl } from "./env";

/**
 * Service-role client. Bypasses RLS entirely, so it must never be reachable
 * from the browser — hence `server-only`. It exists for exactly two jobs:
 *
 *   1. reading/writing `secure_settings` (SMTP credentials), which has no
 *      RLS policies at all and is therefore closed to every other role;
 *   2. inserting an enquiry's mail-delivery result after the public insert.
 *
 * Callers must do their own authorisation check first — see `requireAdmin()`.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
