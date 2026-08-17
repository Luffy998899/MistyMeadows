"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "media";
const MAX_BYTES = 200 * 1024 * 1024; // matches the bucket's file_size_limit

/** How many uploads run at once. */
const CONCURRENCY = 3;

type Status = "waiting" | "uploading" | "done" | "failed";
type Item = { file: File; status: Status; error?: string };

async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "IMG_2481 misty terrace.JPG" → "IMG 2481 misty terrace" */
function captionFrom(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

/**
 * Upload a whole folder of photographs at once.
 *
 * Adding nineteen pictures through the single-file picker means nineteen
 * round trips through a form, which is the complaint this answers. Files are
 * dropped or picked in bulk, uploaded a few at a time, and — when a category
 * is given — added to the gallery in one go.
 *
 * Notes on the implementation:
 *
 *  - Uploads run under the admin's own session, so storage RLS applies and no
 *    service-role key reaches the browser. Same as the single-file picker.
 *  - Three at a time, not all at once: a phone-camera folder is easily 200 MB,
 *    and thirty parallel uploads on a hill-station connection stall each other
 *    and time out.
 *  - Each file is independent. One failure is reported against that file and
 *    the rest carry on, rather than losing a batch to a single bad image.
 *  - `sort_order` continues from whatever is already in the gallery, so a
 *    second batch lands after the first instead of interleaving.
 */
export function BulkUpload({
  /** When set, each uploaded file also becomes a row in this table. */
  attachTo,
  defaultCategory = "",
}: {
  attachTo?: "gallery_items";
  defaultCategory?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  function queue(files: FileList | File[]) {
    const accepted = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (accepted.length === 0) return;
    setSummary(null);
    setItems(accepted.map((file) => ({ file, status: "waiting" as Status })));
  }

  function update(index: number, patch: Partial<Item>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function start() {
    if (items.length === 0 || busy) return;
    setBusy(true);
    setSummary(null);

    const supabase = createClient();

    // Continue the gallery's numbering rather than restarting at zero.
    let nextSort = 0;
    if (attachTo) {
      const { data } = await supabase
        .from(attachTo)
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      nextSort = Number((data?.[0] as { sort_order?: number } | undefined)?.sort_order ?? 0);
    }

    let succeeded = 0;
    let failed = 0;
    let cursor = 0;

    async function worker() {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;

        const { file } = items[index];
        update(index, { status: "uploading", error: undefined });

        try {
          if (file.size > MAX_BYTES) throw new Error("Larger than 200 MB");

          // Prefixed with the index as well as the clock: two files picked in
          // the same batch can land in the same millisecond.
          const path = `${Date.now()}-${index}-${safeName(file.name)}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: "31536000", upsert: false });
          if (uploadError) throw new Error(uploadError.message);

          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET).getPublicUrl(path);

          const size = await imageSize(file);

          const { data: media, error: mediaError } = await supabase
            .from("media")
            .insert({
              storage_path: path,
              public_url: publicUrl,
              kind: file.type.startsWith("video/") ? "video" : "image",
              alt: "",
              title: file.name,
              width: size?.width ?? null,
              height: size?.height ?? null,
              size_bytes: file.size,
            })
            .select("id")
            .single();
          if (mediaError) throw new Error(mediaError.message);

          if (attachTo) {
            const { error: attachError } = await supabase.from(attachTo).insert({
              media_id: (media as { id: string }).id,
              caption: captionFrom(file.name),
              category: category.trim() || "Resort",
              sort_order: ++nextSort,
              published: true,
            });
            if (attachError) throw new Error(attachError.message);
          }

          update(index, { status: "done" });
          succeeded++;
        } catch (error) {
          update(index, {
            status: "failed",
            error: error instanceof Error ? error.message : "Upload failed",
          });
          failed++;
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setBusy(false);
    setSummary(
      failed === 0
        ? `${succeeded} uploaded. They are on the website now.`
        : `${succeeded} uploaded, ${failed} failed — see the list below.`,
    );

    if (succeeded > 0) router.refresh();
  }

  const pending = items.filter((i) => i.status === "waiting" || i.status === "uploading").length;

  return (
    <section className="mt-8 border border-paper-edge bg-paper p-6">
      <h2 className="font-display text-[1.25rem]">Upload several at once</h2>
      <p className="mt-1.5 text-sm text-stone">
        Drop a folder of photographs here, or choose them all in one go.
        {attachTo ? " Each one is added to the gallery straight away." : null}
      </p>

      {attachTo ? (
        <div className="mt-5 max-w-xs">
          <label htmlFor="bulk-category" className="field-label">
            Category for this batch
          </label>
          <input
            id="bulk-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Rooms"
            className="field"
          />
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          queue(e.dataTransfer.files);
        }}
        className={`mt-5 border border-dashed p-8 text-center transition-colors ${
          dragging ? "border-green bg-mint" : "border-paper-edge"
        }`}
      >
        <p className="text-sm text-stone">Drag photographs here</p>
        <p className="my-2 text-xs uppercase tracking-[0.16em] text-stone">or</p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm"
          onChange={(e) => e.target.files && queue(e.target.files)}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn btn-outline"
          disabled={busy}
        >
          Choose files
        </button>
      </div>

      {items.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={start} className="btn btn-solid" disabled={busy}>
              {busy ? `Uploading… ${pending} left` : `Upload ${items.length} file${items.length === 1 ? "" : "s"}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setSummary(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="link-underline text-sm text-stone"
              disabled={busy}
            >
              Clear
            </button>
          </div>

          <ul className="mt-5 max-h-64 overflow-y-auto border-t border-paper-edge text-sm">
            {items.map((item, i) => (
              <li
                key={`${item.file.name}-${i}`}
                className="flex items-center justify-between gap-4 border-b border-paper-edge py-2.5"
              >
                <span className="truncate">{item.file.name}</span>
                <span
                  className={
                    item.status === "done"
                      ? "shrink-0 text-green"
                      : item.status === "failed"
                        ? "shrink-0 text-wine"
                        : "shrink-0 text-stone"
                  }
                >
                  {item.status === "done"
                    ? "Uploaded"
                    : item.status === "failed"
                      ? (item.error ?? "Failed")
                      : item.status === "uploading"
                        ? "Uploading…"
                        : `${Math.round(item.file.size / 1024)} kB`}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {summary ? (
        <p role="status" className="mt-5 border-l-2 border-gold pl-4 text-sm">
          {summary}
        </p>
      ) : null}
    </section>
  );
}
