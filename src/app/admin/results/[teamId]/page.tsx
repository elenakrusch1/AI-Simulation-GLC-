import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getTeamResultDetail } from "@/lib/data/results";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ManualAdjustmentForm } from "@/components/admin/ManualAdjustmentForm";
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from "@/lib/status-labels";

export default async function AdminTeamResultDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  await requireAdmin();
  const { teamId } = await params;
  const detail = await getTeamResultDetail(teamId);
  if (!detail) notFound();

  const rounds = await prisma.round.findMany({ orderBy: { number: "asc" }, select: { id: true, name: true } });
  const totalAdjustments = detail.adjustments.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">{detail.team.name}</h1>
        <p className="text-brand-700">Team code: {detail.team.code}</p>
      </div>

      {[detail.round1, detail.round2].map(({ round, submission }, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-950">{round ? round.name : `Round ${index + 1}`}</h2>
            {submission ? (
              <StatusBadge
                label={SUBMISSION_STATUS_LABEL[submission.status]}
                tone={SUBMISSION_STATUS_TONE[submission.status]}
              />
            ) : (
              <StatusBadge label="No submission" tone="neutral" />
            )}
          </div>

          {submission && "roundOneDecision" in submission && submission.roundOneDecision ? (
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-brand-700">Primary customer</dt>
                <dd className="text-brand-950">{submission.roundOneDecision.primaryCustomer.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-700">Secondary customer</dt>
                <dd className="text-brand-950">{submission.roundOneDecision.secondaryCustomer.name}</dd>
              </div>
              {submission.roundOneDecision.rationale ? (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-semibold text-brand-700">Rationale</dt>
                  <dd className="whitespace-pre-wrap text-brand-950">{submission.roundOneDecision.rationale}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {submission && "roundTwoDecisions" in submission && submission.roundTwoDecisions.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {submission.roundTwoDecisions.map((d) => (
                <dl key={d.id} className="rounded-md border border-slate-100 p-3">
                  <dt className="text-sm font-semibold text-brand-700">
                    {d.customerRole} — {d.customer.name}
                  </dt>
                  <dd className="text-brand-950">Solution: {d.technicalSolution.name}</dd>
                  <dd className="text-brand-950">Model: {d.commercialModel.name}</dd>
                  {d.rationale ? <dd className="mt-1 whitespace-pre-wrap text-brand-700">{d.rationale}</dd> : null}
                </dl>
              ))}
            </div>
          ) : null}
        </div>
      ))}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-950">Calculated scores</h2>
        {detail.scoreResults.length === 0 ? (
          <p className="text-brand-700">No calculated scores yet — use Recalculate on the Results page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-brand-700">
                  <th className="py-2 pr-4 font-semibold">Round</th>
                  <th className="py-2 pr-4 font-semibold">Model version</th>
                  <th className="py-2 pr-4 font-semibold">Score</th>
                  <th className="py-2 font-semibold">Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {detail.scoreResults.map((result) => (
                  <tr key={result.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-4 text-brand-950">{result.round.name}</td>
                    <td className="py-2 pr-4 text-brand-700">
                      {result.scoringModelVersion.name} ({result.scoringModelVersion.status})
                    </td>
                    <td className="py-2 pr-4 font-semibold text-brand-950">{result.calculatedScore}</td>
                    <td className="py-2 text-xs text-brand-700">
                      {result.breakdowns.length === 0
                        ? "—"
                        : result.breakdowns.map((b) => (
                            <div key={b.id}>{b.internalDescription}</div>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-brand-950">Manual adjustments</h2>
        <p className="mb-4 text-sm text-brand-700">
          Adjustments are recorded separately and never overwrite a
          calculated score. Current total adjustment: {totalAdjustments}.
        </p>
        {detail.adjustments.length > 0 ? (
          <ul className="mb-6 flex flex-col gap-2 text-sm">
            {detail.adjustments.map((a) => (
              <li key={a.id} className="rounded-md border border-slate-100 p-3">
                <span className="font-semibold text-brand-950">{a.amount >= 0 ? `+${a.amount}` : a.amount}</span>{" "}
                <span className="text-brand-700">
                  — {a.reason} ({a.round?.name ?? "team-wide"}, by {a.createdByUser.loginIdentifier} on{" "}
                  {a.createdAt.toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <ManualAdjustmentForm teamId={teamId} rounds={rounds} />
      </div>
    </div>
  );
}
