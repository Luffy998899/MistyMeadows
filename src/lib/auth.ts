import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

export type AdminUser = {
  id: string;
  email: string;
};

/**
 * Returns the signed-in admin, or null.
 *
 * Two checks, both required: a valid Supabase session (`getUser()` verifies
 * the JWT with the auth server rather than trusting the cookie), and
 * membership of `admin_users`. Signing up is not enough to reach /admin — the
 * owner has to be added to the allowlist explicitly.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error(`[auth] is_admin check failed: ${error.message}`);
    return null;
  }
  if (!isAdmin) return null;

  return { id: user.id, email: user.email ?? "" };
}

/** Guard for admin pages and server actions. Redirects instead of throwing. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
