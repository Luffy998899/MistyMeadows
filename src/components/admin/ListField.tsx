"use client";

import { useId, useState } from "react";

/**
 * Repeatable single-line field — phone numbers, email addresses, address
 * lines.
 *
 * This replaces a one-value-per-line textarea, which was easy to get wrong:
 * typing "88375 84689 / 88726 84689" produced a single unusable entry rather
 * than two numbers.
 *
 * Each row submits under the same `name`, so the server reads them with
 * `formData.getAll(name)`. Pasting several values at once splits them across
 * rows automatically when `splitPattern` is given — phone numbers and emails
 * get separator-splitting, address lines only split on newlines, because a
 * street address legitimately contains commas and slashes.
 */
export function ListField({
  name,
  label,
  values,
  help,
  placeholder,
  type = "text",
  splitPattern,
}: {
  name: string;
  label: string;
  values: string[];
  help?: string;
  placeholder?: string;
  type?: "text" | "tel" | "email";
  /** When set, pasted text is split on this and spread across rows. */
  splitPattern?: RegExp;
}) {
  const fieldId = useId();

  // Always keep one empty row so there is somewhere to type.
  const [rows, setRows] = useState<string[]>(values.length > 0 ? values : [""]);

  const update = (index: number, value: string) => {
    const pieces = splitPattern
      ? value.split(splitPattern).map((piece) => piece.trim()).filter(Boolean)
      : [value];

    setRows((current) => {
      const next = [...current];
      if (pieces.length > 1) {
        // A multi-value paste: expand it in place.
        next.splice(index, 1, ...pieces);
      } else {
        next[index] = value;
      }
      return next;
    });
  };

  const remove = (index: number) =>
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });

  return (
    <div>
      <span className="field-label">{label}</span>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              id={index === 0 ? fieldId : undefined}
              name={name}
              type={type}
              value={row}
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => update(index, event.target.value)}
              className="field bg-paper"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              title="Remove"
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-paper-edge text-stone transition-colors hover:border-wine hover:text-wine"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setRows((current) => [...current, ""])}
        className="link-underline mt-2 text-xs text-wine"
      >
        + Add another
      </button>

      {help ? <p className="mt-1.5 text-xs text-stone">{help}</p> : null}
    </div>
  );
}
