"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { recalculateRoundAction, type RecalculateState } from "@/app/admin/results/actions";

const initialState: RecalculateState = {};

export function RecalculateButton({ roundSlug, label }: { roundSlug: "round-1" | "round-2"; label: string }) {
  const [state, formAction, pending] = useActionState(recalculateRoundAction, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="roundSlug" value={roundSlug} />
      <Button type="submit" variant="secondary" disabled={pending} className="px-3 py-1.5 text-sm">
        {pending ? "Recalculating…" : label}
      </Button>
      {state.formError ? <p className="text-sm text-status-danger">{state.formError}</p> : null}
      {state.success ? <p className="text-sm text-status-open">{state.success}</p> : null}
    </form>
  );
}
