"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  saveRoundTwoDraftAction,
  submitRoundTwoAction,
  type RoundTwoFormState,
} from "@/app/team/round-2/actions";

interface Option {
  id: string;
  name: string;
}

interface CustomerCardData {
  role: "PRIMARY" | "SECONDARY";
  customerId: string;
  customerName: string;
  initialTechnicalSolutionId: string;
  initialCommercialModelId: string;
  initialRationale: string;
}

interface RoundTwoFormProps {
  primary: CustomerCardData;
  secondary: CustomerCardData;
  technicalSolutions: Option[];
  commercialModels: Option[];
}

const initialState: RoundTwoFormState = {};

interface SideState {
  technicalSolutionId: string;
  commercialModelId: string;
  rationale: string;
}

function CustomerCard({
  card,
  side,
  onChange,
  technicalSolutions,
  commercialModels,
  fieldErrors,
}: {
  card: CustomerCardData;
  side: SideState;
  onChange: (next: SideState) => void;
  technicalSolutions: Option[];
  commercialModels: Option[];
  fieldErrors?: Record<string, string>;
}) {
  const prefix = card.role === "PRIMARY" ? "primary" : "secondary";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-brand-950">
        {card.role === "PRIMARY" ? "Primary customer" : "Secondary customer"}
      </h3>
      <p className="mt-1 text-brand-700">{card.customerName}</p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${prefix}TechnicalSolutionId`} className="text-sm font-medium text-brand-900">
            Technical solution
          </label>
          <select
            id={`${prefix}TechnicalSolutionId`}
            name={`${prefix}TechnicalSolutionId`}
            value={side.technicalSolutionId}
            onChange={(e) => onChange({ ...side, technicalSolutionId: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          >
            <option value="">Select a technical solution…</option>
            {technicalSolutions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {fieldErrors?.[`${prefix}TechnicalSolutionId`] ? (
            <p className="text-sm text-status-danger" role="alert">
              {fieldErrors[`${prefix}TechnicalSolutionId`]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${prefix}CommercialModelId`} className="text-sm font-medium text-brand-900">
            Commercial model
          </label>
          <select
            id={`${prefix}CommercialModelId`}
            name={`${prefix}CommercialModelId`}
            value={side.commercialModelId}
            onChange={(e) => onChange({ ...side, commercialModelId: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          >
            <option value="">Select a commercial model…</option>
            {commercialModels.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {fieldErrors?.[`${prefix}CommercialModelId`] ? (
            <p className="text-sm text-status-danger" role="alert">
              {fieldErrors[`${prefix}CommercialModelId`]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${prefix}Rationale`} className="text-sm font-medium text-brand-900">
            Rationale <span className="font-normal text-brand-700">(optional)</span>
          </label>
          <textarea
            id={`${prefix}Rationale`}
            name={`${prefix}Rationale`}
            rows={3}
            maxLength={2000}
            value={side.rationale}
            onChange={(e) => onChange({ ...side, rationale: e.target.value })}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          />
        </div>
      </div>
    </div>
  );
}

export function RoundTwoForm({ primary, secondary, technicalSolutions, commercialModels }: RoundTwoFormProps) {
  const [primaryState, setPrimaryState] = useState<SideState>({
    technicalSolutionId: primary.initialTechnicalSolutionId,
    commercialModelId: primary.initialCommercialModelId,
    rationale: primary.initialRationale,
  });
  const [secondaryState, setSecondaryState] = useState<SideState>({
    technicalSolutionId: secondary.initialTechnicalSolutionId,
    commercialModelId: secondary.initialCommercialModelId,
    rationale: secondary.initialRationale,
  });
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [draftState, draftFormAction, draftPending] = useActionState(saveRoundTwoDraftAction, initialState);
  const [submitState, submitFormAction, submitPending] = useActionState(submitRoundTwoAction, initialState);

  const technicalSolutionName = useMemo(
    () => (id: string) => technicalSolutions.find((o) => o.id === id)?.name ?? "",
    [technicalSolutions],
  );
  const commercialModelName = useMemo(
    () => (id: string) => commercialModels.find((o) => o.id === id)?.name ?? "",
    [commercialModels],
  );

  function goToReview() {
    const missing =
      !primaryState.technicalSolutionId ||
      !primaryState.commercialModelId ||
      !secondaryState.technicalSolutionId ||
      !secondaryState.commercialModelId;
    if (missing) {
      setReviewError("Select a technical solution and commercial model for both customers before reviewing.");
      return;
    }
    setReviewError(null);
    setStep("review");
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-6">
        {[
          { card: primary, side: primaryState },
          { card: secondary, side: secondaryState },
        ].map(({ card, side }) => (
          <div key={card.role} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-brand-950">
              {card.role === "PRIMARY" ? "Primary customer" : "Secondary customer"} — {card.customerName}
            </h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-brand-700">Technical solution</dt>
                <dd className="text-brand-950">{technicalSolutionName(side.technicalSolutionId)}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-700">Commercial model</dt>
                <dd className="text-brand-950">{commercialModelName(side.commercialModelId)}</dd>
              </div>
              {side.rationale ? (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-semibold text-brand-700">Rationale</dt>
                  <dd className="whitespace-pre-wrap text-brand-950">{side.rationale}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ))}

        {submitState.formError ? (
          <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
            {submitState.formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => setStep("edit")}>
            Back to edit
          </Button>
          <Button type="button" onClick={() => setConfirmOpen(true)}>
            Final submit
          </Button>
        </div>

        {confirmOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-submit-r2-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onKeyDown={(e) => {
              if (e.key === "Escape") setConfirmOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 id="confirm-submit-r2-title" className="text-lg font-bold text-brand-950">
                Submit Round 2 decisions?
              </h3>
              <p className="mt-2 text-brand-700">
                Once submitted, these decisions are final for Round 2 and
                cannot be edited again.
              </p>
              <form action={submitFormAction} className="mt-6 flex flex-wrap justify-end gap-3">
                <input type="hidden" name="primaryCustomerId" value={primary.customerId} />
                <input type="hidden" name="primaryTechnicalSolutionId" value={primaryState.technicalSolutionId} />
                <input type="hidden" name="primaryCommercialModelId" value={primaryState.commercialModelId} />
                <input type="hidden" name="primaryRationale" value={primaryState.rationale} />
                <input type="hidden" name="secondaryCustomerId" value={secondary.customerId} />
                <input type="hidden" name="secondaryTechnicalSolutionId" value={secondaryState.technicalSolutionId} />
                <input type="hidden" name="secondaryCommercialModelId" value={secondaryState.commercialModelId} />
                <input type="hidden" name="secondaryRationale" value={secondaryState.rationale} />
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
      <input type="hidden" name="primaryCustomerId" value={primary.customerId} />
      <input type="hidden" name="secondaryCustomerId" value={secondary.customerId} />

      <CustomerCard
        card={primary}
        side={primaryState}
        onChange={setPrimaryState}
        technicalSolutions={technicalSolutions}
        commercialModels={commercialModels}
        fieldErrors={draftState.fieldErrors}
      />
      <CustomerCard
        card={secondary}
        side={secondaryState}
        onChange={setSecondaryState}
        technicalSolutions={technicalSolutions}
        commercialModels={commercialModels}
        fieldErrors={draftState.fieldErrors}
      />

      {draftState.formError ? (
        <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {draftState.formError}
        </p>
      ) : null}
      {draftState.success ? (
        <p className="rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
          {draftState.success}
        </p>
      ) : null}
      {reviewError ? (
        <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {reviewError}
        </p>
      ) : null}

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
