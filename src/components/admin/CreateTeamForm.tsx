"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createTeamAction, type TeamFormState } from "@/app/admin/teams/actions";

const initialState: TeamFormState = {};

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      noValidate
    >
      <h2 className="col-span-full text-lg font-bold text-brand-950">Create a team</h2>
      <Field label="Team name" name="name" type="text" required error={state.fieldErrors?.name} />
      <Field
        label="Team code (used to log in)"
        name="code"
        type="text"
        required
        placeholder="e.g. TEAM-01"
        error={state.fieldErrors?.code}
      />
      <div className="sm:col-span-2">
        <Field
          label="Initial password"
          name="password"
          type="text"
          required
          placeholder="At least 12 characters, letters and numbers"
          error={state.fieldErrors?.password}
        />
      </div>
      {state.formError ? (
        <p className="col-span-full rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state.success ? (
        <p className="col-span-full rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
          {state.success}
        </p>
      ) : null}
      <div className="col-span-full">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create team"}
        </Button>
      </div>
    </form>
  );
}
