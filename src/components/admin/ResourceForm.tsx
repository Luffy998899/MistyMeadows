"use client";

import Link from "next/link";
import { useActionState } from "react";

import { saveResourceAction, type ActionResult } from "@/app/admin/actions";
import type { Field, Resource } from "@/lib/admin/resources";
import type { Media } from "@/lib/types";

import { MediaPicker } from "./MediaPicker";

type Row = Record<string, unknown>;

/** Turns a stored value back into something an input can display. */
function inputValue(field: Field, row: Row): string {
  const value = row[field.name];
  if (value === null || value === undefined) return "";

  if (field.type === "tags") {
    return Array.isArray(value) ? value.join("\n") : "";
  }
  if (field.type === "datetime" && typeof value === "string") {
    // <input type="datetime-local"> wants `YYYY-MM-DDTHH:mm`.
    return value.slice(0, 16);
  }
  if (field.type === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }
  return String(value);
}

function FieldControl({
  field,
  row,
  media,
}: {
  field: Field;
  row: Row;
  media: Record<string, Media | null>;
}) {
  const id = `field-${field.name}`;
  const value = inputValue(field, row);

  if (field.type === "media") {
    return (
      <MediaPicker
        name={field.name}
        label={field.label}
        initial={media[field.name] ?? null}
        required={field.required}
        help={field.help}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-start gap-3 border border-paper-edge bg-paper p-4">
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={row[field.name] === undefined ? true : Boolean(row[field.name])}
          className="mt-1 h-4 w-4 accent-[#865d36]"
        />
        <label htmlFor={id} className="text-sm">
          {field.label}
          {field.help ? <span className="block text-xs text-stone">{field.help}</span> : null}
        </label>
      </div>
    );
  }

  const label = (
    <label htmlFor={id} className="field-label">
      {field.label} {field.required ? <span aria-hidden="true">*</span> : null}
    </label>
  );

  const help = field.help ? <p className="mt-1.5 text-xs text-stone">{field.help}</p> : null;

  if (field.type === "textarea" || field.type === "tags") {
    return (
      <div>
        {label}
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 4}
          defaultValue={value}
          required={field.required}
          className="field resize-y bg-paper"
        />
        {help}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          id={id}
          name={field.name}
          defaultValue={value || field.options?.[0]?.value}
          className="field bg-paper"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {help}
      </div>
    );
  }

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "datetime"
          ? "datetime-local"
          : "text";

  return (
    <div>
      {label}
      <input
        id={id}
        name={field.name}
        type={inputType}
        defaultValue={value}
        required={field.required}
        min={field.min}
        max={field.max}
        className="field bg-paper"
      />
      {help}
    </div>
  );
}

export function ResourceForm({
  resource,
  id,
  row,
  media,
}: {
  resource: Resource;
  id: string;
  row: Row;
  media: Record<string, Media | null>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveResourceAction,
    null,
  );

  // Full-width controls read better for long text and the media picker.
  const isWide = (field: Field) =>
    field.type === "textarea" ||
    field.type === "tags" ||
    field.type === "media" ||
    field.type === "boolean";

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="__resource" value={resource.key} />
      <input type="hidden" name="__id" value={id} />

      <div className="grid gap-5 sm:grid-cols-2">
        {resource.fields.map((field) => (
          <div key={field.name} className={isWide(field) ? "sm:col-span-2" : ""}>
            <FieldControl field={field} row={row} media={media} />
          </div>
        ))}
      </div>

      {state?.error ? (
        <p role="alert" className="mt-6 border-l-2 border-bark bg-paper p-4 text-sm text-bark">
          {state.error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-solid" disabled={pending}>
          {pending ? "Saving…" : `Save ${resource.singular.toLowerCase()}`}
        </button>
        <Link href={`/admin/${resource.key}`} className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
