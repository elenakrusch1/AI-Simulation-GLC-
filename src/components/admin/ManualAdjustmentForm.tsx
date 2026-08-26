"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { addManualAdjustmentAction, type AdjustmentFormState } from "@/app/admin/results/actions";

const initialState: AdjustmentFormState = {};

export function ManualAdjustmentForm({
  teamId,
  rounds,
}: {
  teamId: string;
  rounds: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(addManualAdjustmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="hidden" name="teamId" value={teamId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="roundId" className="text-sm font-medium text-brand-900">
          Round <span className="font-normal text-brand-700">(optional — leave blank for team-wide)</span>
        </label>
        <select id="roundId" name="roundId" defaultValue="" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm">
          <option value="">Team-wide</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <Field label="Amount" name="amount" type="number" step="1" required error={state.fieldErrors?.amount} />
      <div className="sm:col-span-2">
        <Field label="Reason" name="reason" type="text" required error={state.fieldErrors?.reason} />
      </div>
      {state.formError ? (
        <p className="sm:col-span-2 rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
          {state.success}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record adjustment"}
        </Button>
      </div>
    </form>
  );
}
