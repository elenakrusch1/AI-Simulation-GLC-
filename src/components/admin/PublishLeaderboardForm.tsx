"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { publishLeaderboardAction, type PublishFormState } from "@/app/admin/leaderboard/actions";

const initialState: PublishFormState = {};

export function PublishLeaderboardForm({ rounds }: { rounds: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(publishLeaderboardAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" noValidate>
      <h2 className="text-lg font-bold text-brand-950">Publish a leaderboard snapshot</h2>
      <Field label="Title" name="title" type="text" placeholder="e.g. Standings after Round 1" required error={state.fieldErrors?.title} />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-brand-900">Rounds to include</legend>
        {rounds.map((round) => (
          <label key={round.id} className="flex items-center gap-2 text-brand-950">
            <input type="checkbox" name="roundIds" value={round.id} className="h-4 w-4 rounded border-slate-300" />
            {round.name}
          </label>
        ))}
        {state.fieldErrors?.roundIds ? (
          <p className="text-sm text-status-danger" role="alert">{state.fieldErrors.roundIds}</p>
        ) : null}
      </fieldset>
      {state.formError ? (
        <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">{state.formError}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">{state.success}</p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish snapshot"}
        </Button>
      </div>
    </form>
  );
}
