import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getScoringModelVersionDetail } from "@/lib/data/scoring";
import { listActiveCustomers, listActiveTechnicalSolutions, listActiveCommercialModels } from "@/lib/data/reference";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { AddScoringRuleForm } from "@/components/admin/AddScoringRuleForm";
import {
  activateScoringModelVersionAction,
  archiveScoringModelVersionAction,
  revertScoringModelVersionToDraftAction,
  setScoringRuleActiveAction,
} from "@/app/admin/scoring/actions";
import type { BadgeTone } from "@/lib/status-labels";

const STATUS_TONE: Record<string, BadgeTone> = { DRAFT: "draft", ACTIVE: "open", ARCHIVED: "locked" };

export default async function ScoringVersionDetailPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  await requireAdmin();
  const { versionId } = await params;
  const version = await getScoringModelVersionDetail(versionId);
  if (!version) notFound();

  const isDraft = version.status === "DRAFT";
  const [customers, technicalSolutions, commercialModels] = isDraft
    ? await Promise.all([listActiveCustomers(), listActiveTechnicalSolutions(), listActiveCommercialModels()])
    : [[], [], []];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-950">{version.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge label={version.status} tone={STATUS_TONE[version.status] ?? "neutral"} />
            <span className="text-sm text-brand-700">Created by {version.createdByUser.loginIdentifier}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {version.status === "DRAFT" ? (
            <form action={activateScoringModelVersionAction}>
              <input type="hidden" name="scoringModelVersionId" value={version.id} />
              <Button type="submit">Activate</Button>
            </form>
          ) : null}
          {version.status === "ACTIVE" ? (
            <form action={revertScoringModelVersionToDraftAction}>
              <input type="hidden" name="scoringModelVersionId" value={version.id} />
              <Button type="submit" variant="secondary">Back to draft</Button>
            </form>
          ) : null}
          {version.status === "ACTIVE" ? (
            <form action={archiveScoringModelVersionAction}>
              <input type="hidden" name="scoringModelVersionId" value={version.id} />
              <Button type="submit" variant="danger">Archive</Button>
            </form>
          ) : null}
        </div>
      </div>

      {isDraft ? (
        <AddScoringRuleForm
          scoringModelVersionId={version.id}
          customers={customers}
          technicalSolutions={technicalSolutions}
          commercialModels={commercialModels}
        />
      ) : version.status === "ACTIVE" ? (
        <p className="rounded-md bg-status-locked-bg px-3 py-2 text-sm text-status-locked">
          This version is ACTIVE. Rules can be changed again once
          it&apos;s sent back to draft with &quot;Back to
          draft&quot; — while no scoring model is active, scores
          calculate to zero.
        </p>
      ) : (
        <p className="rounded-md bg-status-locked-bg px-3 py-2 text-sm text-status-locked">
          Rules can only be added or changed while this version is in DRAFT.
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-950">Rules ({version.rules.length})</h2>
        {version.rules.length === 0 ? (
          <p className="text-brand-700">No rules yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-brand-700">
                  <th className="py-2 pr-4 font-semibold">Round</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Points</th>
                  <th className="py-2 pr-4 font-semibold">Targets</th>
                  <th className="py-2 pr-4 font-semibold">Active</th>
                  {isDraft ? <th className="py-2 font-semibold" /> : null}
                </tr>
              </thead>
              <tbody>
                {version.rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4 text-brand-950">{rule.roundNumber}</td>
                    <td className="py-3 pr-4 text-brand-950">{rule.ruleType}</td>
                    <td className="py-3 pr-4 text-brand-950">{rule.points}</td>
                    <td className="py-3 pr-4 text-brand-700">
                      {[
                        rule.customer ? `customer=${rule.customer.name}` : null,
                        rule.customerRole ? `role=${rule.customerRole}` : null,
                        rule.technicalSolution ? `solution=${rule.technicalSolution.name}` : null,
                        rule.commercialModel ? `model=${rule.commercialModel.name}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "any"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={rule.active ? "Active" : "Disabled"} tone={rule.active ? "open" : "locked"} />
                    </td>
                    {isDraft ? (
                      <td className="py-3">
                        <form action={setScoringRuleActiveAction}>
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <input type="hidden" name="active" value={(!rule.active).toString()} />
                          <Button type="submit" variant="secondary" className="px-3 py-1 text-xs">
                            {rule.active ? "Disable" : "Enable"}
                          </Button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
