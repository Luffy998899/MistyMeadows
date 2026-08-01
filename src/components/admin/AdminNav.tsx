"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { PeakMark } from "@/components/PeakMark";
import { RESOURCES } from "@/lib/admin/resources";

const TOP = [{ href: "/admin", label: "Overview" }];
const BOTTOM = [
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/settings", label: "Settings" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const groups = [
    { heading: null, items: TOP },
    { heading: "Content", items: RESOURCES.map((r) => ({ href: `/admin/${r.key}`, label: r.label })) },
    { heading: "Resort", items: BOTTOM },
  ];

  return (
    <nav aria-label="Admin" className="space-y-7">
      {groups.map((group, i) => (
        <div key={i}>
          {group.heading ? <p className="eyebrow mb-3">{group.heading}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              // `/admin` would otherwise match every child route.
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-pine text-paper"
                        : "text-ink/75 hover:bg-paper-warm hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminNav({ email, signOut }: { email: string; signOut: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-edge bg-paper px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <PeakMark className="h-5 w-auto text-green" />
          <span className="font-display text-[0.9375rem]">Resort admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            {open ? (
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.4" />
            ) : (
              <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.4" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-b border-paper-edge bg-paper px-4 py-6 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
          <div className="mt-7 border-t border-paper-edge pt-5">
            <p className="text-xs text-stone">{email}</p>
            <div className="mt-3">{signOut}</div>
          </div>
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 border-r border-paper-edge bg-paper lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-5">
          <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2">
            <PeakMark className="h-5 w-auto text-green" />
            <span className="font-display text-[0.9375rem]">Resort admin</span>
          </Link>

          <div className="mt-7 flex-1 overflow-y-auto">
            <NavList />
          </div>

          <div className="border-t border-paper-edge pt-4">
            <Link
              href="/"
              className="link-underline mb-3 block px-3 text-xs text-stone"
              target="_blank"
            >
              View the website ↗
            </Link>
            <p className="truncate px-3 text-xs text-stone" title={email}>
              {email}
            </p>
            <div className="mt-2 px-3">{signOut}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
