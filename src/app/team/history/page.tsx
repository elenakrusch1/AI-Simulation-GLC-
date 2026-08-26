import { requireTeam } from "@/lib/auth/guards";
import { getTeamRoundOneView, getTeamRoundTwoView } from "@/lib/data/submissions";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from "@/lib/status-labels";

export default async function TeamHistoryPage() {
  const session = await requireTeam();
  if (!session.teamId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-brand-700">No team is associated with this account.</p>
      </div>
    );
  }

  const [round1, round2, round1Row, round2Row] = await Promise.all([
    getTeamRoundOneView(session.teamId),
    getTeamRoundTwoView(session.teamId),
    prisma.round.findUnique({ where: { slug: "round-1" }, select: { openedAt: true } }),
    prisma.round.findUnique({ where: { slug: "round-2" }, select: { openedAt: true } }),
  ]);

  const entries = [
    {
      released: !!round1Row?.openedAt,
      name: round1.round?.name ?? "Customer Selection",
      status: round1.submissionStatus,
      submittedAt: round1.submittedAt,
      summary: round1.decision
        ? [`Primary: ${round1.decision.primaryCustomerName}`, `Secondary: ${round1.decision.secondaryCustomerName}`]
        : [],
    },
    {
      released: !!round2Row?.openedAt,
      name: round2.round?.name ?? "Offer Design",
      status: round2.submissionStatus,
      submittedAt: round2.submittedAt,
      summary: round2.decisions.map(
        (d) => `${d.customerRole === "PRIMARY" ? "Primary" : "Secondary"} (${d.customerName}): ${d.technicalSolutionName} · ${d.commercialModelName}`,
      ),
    },
  ].filter((entry) => entry.released && entry.status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Submission history</h1>
        <p className="mt-1 text-brand-700">Your team&apos;s released submissions.</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-brand-700">Nothing to show yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div key={entry.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-brand-950">{entry.name}</h2>
                {entry.status ? (
                  <StatusBadge
                    label={SUBMISSION_STATUS_LABEL[entry.status]}
                    tone={SUBMISSION_STATUS_TONE[entry.status]}
                  />
                ) : null}
              </div>
              {entry.submittedAt ? (
                <p className="mt-1 text-sm text-brand-700">
                  Submitted {entry.submittedAt.toLocaleString()}
                </p>
              ) : null}
              {entry.summary.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 text-brand-950">
                  {entry.summary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
