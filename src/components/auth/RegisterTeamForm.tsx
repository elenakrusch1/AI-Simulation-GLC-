"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { registerTeamAction, type RegisterFormState } from "@/app/register/actions";

const initialState: RegisterFormState = {};

export function RegisterTeamForm() {
  const [state, formAction, pending] = useActionState(registerTeamAction, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      noValidate
    >
      <Field label="Team name" name="name" type="text" required error={state.fieldErrors?.name} />
      <Field
        label="Team code (used to log in)"
        name="code"
        type="text"
        required
        placeholder="e.g. TEAM-01"
        error={state.fieldErrors?.code}
      />
      {state.formError ? (
        <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {state.formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Registering…" : "Register team"}
      </Button>
    </form>
  );
}
