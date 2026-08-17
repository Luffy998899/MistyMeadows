"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Media } from "@/lib/types";

const BUCKET = "media";
const MAX_BYTES = 200 * 1024 * 1024; // matches the bucket's file_size_limit

/** Reads intrinsic dimensions so Next/Image can reserve the right space. */
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

/**
 * Upload-or-choose control backed by Supabase Storage.
 *
 * The upload runs from the browser under the admin's own session, so the
 * storage RLS policies (admin-only insert) apply — no service-role key is
 * exposed to the client. The chosen media id is written into a hidden input
 * so the surrounding server action picks it up with the rest of the form.
 */
export function MediaPicker({
  name,
  label,
  initial,
  required,
  help,
}: {
  name: string;
  label: string;
  initial?: Media | null;
  required?: boolean;
  help?: string;
}) {
  const [selected, setSelected] = useState<Media | null>(initial ?? null);
  const [library, setLibrary] = useState<Media[] | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadLibrary = useCallback(async () => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (loadError) setError(loadError.message);
    else setLibrary((data ?? []) as Media[]);
  }, []);

  useEffect(() => {
    if (browsing && library === null) void loadLibrary();
  }, [browsing, library, loadLibrary]);

  async function onUpload(file: File) {
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("That file is larger than 200 MB.");
      return;
    }

    setBusy(true);
    const supabase = createClient();

    try {
      const path = `${Date.now()}-${safeName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const size = await imageSize(file);

      const { data: row, error: insertError } = await supabase
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
        .select("*")
        .single();

      if (insertError) throw new Error(insertError.message);

      setSelected(row as Media);
      setLibrary(null); // force a refresh next time the library opens
      setBrowsing(false);
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="field-label">
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </span>

      <input type="hidden" name={name} value={selected?.id ?? ""} />

      <div className="flex flex-wrap items-start gap-4 border border-paper-edge bg-paper p-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden bg-paper-warm">
          {selected ? (
            selected.kind === "video" ? (
              <video src={selected.public_url} className="h-full w-full object-cover" muted />
            ) : (
              // Intentionally a plain <img>: this is admin-only chrome and the
              // sources are arbitrary user uploads.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.public_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-stone">
              None
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="btn btn-outline !min-h-0 !px-4 !py-2 !text-[0.6875rem]"
            >
              {busy ? "Uploading…" : "Upload new"}
            </button>

            <button
              type="button"
              onClick={() => setBrowsing((v) => !v)}
              className="btn btn-outline !min-h-0 !px-4 !py-2 !text-[0.6875rem]"
            >
              {browsing ? "Close library" : "Choose existing"}
            </button>

            {selected ? (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn btn-outline !min-h-0 !px-4 !py-2 !text-[0.6875rem]"
              >
                Remove
              </button>
            ) : null}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />

          {selected ? (
            <div className="mt-3">
              <label
                htmlFor={`${name}-alt`}
                className="text-xs text-stone"
              >
                Describe this image for screen readers and search engines
              </label>
              <input
                id={`${name}-alt`}
                defaultValue={selected.alt}
                placeholder="e.g. Valley view from a luxury room balcony"
                onBlur={async (e) => {
                  const alt = e.target.value.trim();
                  if (alt === selected.alt) return;
                  await createClient().from("media").update({ alt }).eq("id", selected.id);
                  setSelected({ ...selected, alt });
                }}
                className="field mt-1 !min-h-0 !py-1.5 !text-sm"
              />
            </div>
          ) : null}

          {help ? <p className="mt-2 text-xs text-stone">{help}</p> : null}
          {error ? (
            <p role="alert" className="mt-2 text-xs text-wine">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {browsing ? (
        <div className="mt-2 max-h-72 overflow-y-auto border border-paper-edge bg-paper p-3">
          {library === null ? (
            <p className="p-3 text-sm text-stone">Loading…</p>
          ) : library.length === 0 ? (
            <p className="p-3 text-sm text-stone">
              Nothing uploaded yet. Use “Upload new” above.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {library.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setBrowsing(false);
                    }}
                    className={`block aspect-square w-full overflow-hidden border-2 ${
                      selected?.id === item.id ? "border-gold" : "border-transparent"
                    }`}
                    title={item.title ?? item.storage_path}
                  >
                    {item.kind === "video" ? (
                      <video src={item.public_url} className="h-full w-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.public_url}
                        alt={item.alt}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
