"use client";

import { useActionState } from "react";

import { deleteResourceAction, type ActionResult } from "@/app/admin/actions";

export function DeleteButton({
  resourceKey,
  id,
  label,
}: {
  resourceKey: string;
  id: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    deleteResourceAction,
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Deletion is not undoable, so make the user say so explicitly.
        if (!confirm(`Delete “${label}”? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="__resource" value={resourceKey} />
      <input type="hidden" name="__id" value={id} />
      <button type="submit" className="link-underline text-xs text-burgundy" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state?.error ? (
        <p role="alert" className="mt-1 text-xs text-burgundy">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
