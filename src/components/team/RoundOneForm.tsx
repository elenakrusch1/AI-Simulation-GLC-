"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  saveRoundOneDraftAction,
  submitRoundOneAction,
  type RoundOneFormState,
} from "@/app/team/round-1/actions";

interface CustomerOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface RoundOneFormProps {
  customers: CustomerOption[];
  initialPrimaryCustomerId: string;
  initialSecondaryCustomerId: string;
  initialRationale: string;
}

const initialState: RoundOneFormState = {};

export function RoundOneForm({
  customers,
  initialPrimaryCustomerId,
  initialSecondaryCustomerId,
  initialRationale,
}: RoundOneFormProps) {
  const [primaryCustomerId, setPrimaryCustomerId] = useState(initialPrimaryCustomerId);
  const [secondaryCustomerId, setSecondaryCustomerId] = useState(initialSecondaryCustomerId);
  const [rationale, setRationale] = useState(initialRationale);
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [draftState, draftFormAction, draftPending] = useActionState(
    saveRoundOneDraftAction,
    initialState,
  );
  const [submitState, submitFormAction, submitPending] = useActionState(
    submitRoundOneAction,
    initialState,
  );

  const primaryName = useMemo(
    () => customers.find((c) => c.id === primaryCustomerId)?.name ?? "",
    [customers, primaryCustomerId],
  );
  const secondaryName = useMemo(
    () => customers.find((c) => c.id === secondaryCustomerId)?.name ?? "",
    [customers, secondaryCustomerId],
  );

  function goToReview() {
    if (!primaryCustomerId || !secondaryCustomerId) {
      setReviewError("Select both a primary and a secondary customer before reviewing.");
      return;
    }
    if (primaryCustomerId === secondaryCustomerId) {
      setReviewError("Primary and secondary customer must be different.");
      return;
    }
    setReviewError(null);
    setStep("review");
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-950">Review your decisions</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-brand-700">Primary customer</dt>
              <dd className="text-brand-950">{primaryName}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-brand-700">Secondary customer</dt>
              <dd className="text-brand-950">{secondaryName}</dd>
            </div>
            {rationale ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-brand-700">Team rationale</dt>
                <dd className="whitespace-pre-wrap text-brand-950">{rationale}</dd>
              </div>
            ) : null}
          </dl>
          {submitState.formError ? (
            <p className="mt-4 rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
              {submitState.formError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("edit")}>
              Back to edit
            </Button>
            <Button type="button" onClick={() => setConfirmOpen(true)}>
              Final submit
            </Button>
          </div>
        </div>

        {confirmOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onKeyDown={(e) => {
              if (e.key === "Escape") setConfirmOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 id="confirm-submit-title" className="text-lg font-bold text-brand-950">
                Submit Round 1 decisions?
              </h3>
              <p className="mt-2 text-brand-700">
                Once submitted, these decisions are final for Round 1 and
                cannot be edited again.
              </p>
              <form action={submitFormAction} className="mt-6 flex flex-wrap justify-end gap-3">
                <input type="hidden" name="primaryCustomerId" value={primaryCustomerId} />
                <input type="hidden" name="secondaryCustomerId" value={secondaryCustomerId} />
                <input type="hidden" name="rationale" value={rationale} />
                <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitPending} autoFocus>
                  {submitPending ? "Submitting…" : "Confirm submission"}
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={draftFormAction} className="flex flex-col gap-6">
      <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="primaryCustomerId" className="text-sm font-medium text-brand-900">
            Primary customer
          </label>
          <select
            id="primaryCustomerId"
            name="primaryCustomerId"
            value={primaryCustomerId}
            onChange={(e) => setPrimaryCustomerId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          >
            <option value="">Select a customer…</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {draftState.fieldErrors?.primaryCustomerId ? (
            <p className="text-sm text-status-danger" role="alert">{draftState.fieldErrors.primaryCustomerId}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="secondaryCustomerId" className="text-sm font-medium text-brand-900">
            Secondary customer
          </label>
          <select
            id="secondaryCustomerId"
            name="secondaryCustomerId"
            value={secondaryCustomerId}
            onChange={(e) => setSecondaryCustomerId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          >
            <option value="">Select a customer…</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {draftState.fieldErrors?.secondaryCustomerId ? (
            <p className="text-sm text-status-danger" role="alert">{draftState.fieldErrors.secondaryCustomerId}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="rationale" className="text-sm font-medium text-brand-900">
            Team rationale <span className="font-normal text-brand-700">(optional)</span>
          </label>
          <textarea
            id="rationale"
            name="rationale"
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            maxLength={2000}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          />
          {draftState.fieldErrors?.rationale ? (
            <p className="text-sm text-status-danger" role="alert">{draftState.fieldErrors.rationale}</p>
          ) : null}
        </div>

        {draftState.formError ? (
          <p className="sm:col-span-2 rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
            {draftState.formError}
          </p>
        ) : null}
        {draftState.success ? (
          <p className="sm:col-span-2 rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
            {draftState.success}
          </p>
        ) : null}
        {reviewError ? (
          <p className="sm:col-span-2 rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
            {reviewError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="secondary" disabled={draftPending}>
          {draftPending ? "Saving…" : "Save draft"}
        </Button>
        <Button type="button" onClick={goToReview}>
          Review decisions
        </Button>
      </div>
    </form>
  );
}
