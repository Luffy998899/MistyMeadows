import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// The admin panel reads live data on every request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /admin/login unless there is a session AND the user is on
  // the admin_users allowlist.
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh bg-paper-warm lg:flex">
      <AdminNav email={admin.email} signOut={<SignOutButton />} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">{children}</main>
      </div>
    </div>
  );
}
