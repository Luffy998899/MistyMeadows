import { NextResponse } from "next/server";

import { getAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enquiry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS: (keyof Enquiry)[] = [
  "created_at",
  "name",
  "email",
  "phone",
  "room_name",
  "check_in",
  "check_out",
  "guests",
  "status",
  "message",
  "admin_note",
  "mail_sent",
];

/**
 * Quotes a value for CSV. The leading-character guard stops spreadsheet
 * software treating a crafted field (=, +, -, @) as a formula.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Enquiry[];
  const csv = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((column) => csvCell(row[column])).join(",")),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="misty-meadows-enquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
