"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createScoringModelVersionAction, type ScoringFormState } from "@/app/admin/scoring/actions";

const initialState: ScoringFormState = {};

export function CreateScoringVersionForm() {
  const [state, formAction, pending] = useActionState(createScoringModelVersionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      noValidate
    >
      <div className="min-w-[240px] flex-1">
        <Field
          label="New scoring model version name"
          name="name"
          type="text"
          placeholder="e.g. Season 2026 v1"
          required
          error={state.fieldErrors?.name}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create draft version"}
      </Button>
      {state.success ? (
        <p className="w-full rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
