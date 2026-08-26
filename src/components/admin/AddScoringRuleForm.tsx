"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createScoringRuleAction, type ScoringFormState } from "@/app/admin/scoring/actions";

interface Option {
  id: string;
  name: string;
}

const initialState: ScoringFormState = {};

export function AddScoringRuleForm({
  scoringModelVersionId,
  customers,
  technicalSolutions,
  commercialModels,
}: {
  scoringModelVersionId: string;
  customers: Option[];
  technicalSolutions: Option[];
  commercialModels: Option[];
}) {
  const [state, formAction, pending] = useActionState(createScoringRuleAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [roundNumber, setRoundNumber] = useState("1");

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
      noValidate
    >
      <input type="hidden" name="scoringModelVersionId" value={scoringModelVersionId} />
      <h3 className="col-span-full text-lg font-bold text-brand-950">Add a rule</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="roundNumber" className="text-sm font-medium text-brand-900">
          Round
        </label>
        <select
          id="roundNumber"
          name="roundNumber"
          value={roundNumber}
          onChange={(e) => setRoundNumber(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm"
        >
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ruleType" className="text-sm font-medium text-brand-900">
          Rule type
        </label>
        <select
          id="ruleType"
          name="ruleType"
          defaultValue="BASE"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm"
        >
          <option value="BASE">Base</option>
          <option value="COMBINATION">Combination</option>
          <option value="BONUS">Bonus</option>
          <option value="PENALTY">Penalty</option>
          <option value="MANUAL_CATEGORY">Manual category (not auto-applied)</option>
        </select>
      </div>

      <Field label="Points" name="points" type="number" step="1" required error={state.fieldErrors?.points} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="customerId" className="text-sm font-medium text-brand-900">
          Customer <span className="font-normal text-brand-700">(optional — wildcard if unset)</span>
        </label>
        <select id="customerId" name="customerId" defaultValue="" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm">
          <option value="">Any</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="customerRole" className="text-sm font-medium text-brand-900">
          Customer role <span className="font-normal text-brand-700">(optional)</span>
        </label>
        <select id="customerRole" name="customerRole" defaultValue="" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm">
          <option value="">Any</option>
          <option value="PRIMARY">Primary</option>
          <option value="SECONDARY">Secondary</option>
        </select>
      </div>

      {roundNumber === "2" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="technicalSolutionId" className="text-sm font-medium text-brand-900">
              Technical solution <span className="font-normal text-brand-700">(optional)</span>
            </label>
            <select id="technicalSolutionId" name="technicalSolutionId" defaultValue="" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm">
              <option value="">Any</option>
              {technicalSolutions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="commercialModelId" className="text-sm font-medium text-brand-900">
              Commercial model <span className="font-normal text-brand-700">(optional)</span>
            </label>
            <select id="commercialModelId" name="commercialModelId" defaultValue="" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-brand-950 shadow-sm">
              <option value="">Any</option>
              {commercialModels.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      <Field label="External rule ID" name="externalRuleId" type="text" placeholder="optional" error={state.fieldErrors?.externalRuleId} />
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Admin note" name="adminNote" type="text" placeholder="optional — never shown to teams" error={state.fieldErrors?.adminNote} />
      </div>

      {state.formError ? (
        <p className="col-span-full rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 ? (
        <div className="col-span-full rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
          <ul className="list-disc pl-5">
            {Object.entries(state.fieldErrors).map(([field, message]) => (
              <li key={field}>
                {field}: {message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.success ? (
        <p className="col-span-full rounded-md bg-status-open-bg px-3 py-2 text-sm text-status-open" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="col-span-full">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add rule"}
        </Button>
      </div>
    </form>
  );
}
