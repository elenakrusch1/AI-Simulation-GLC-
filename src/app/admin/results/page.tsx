import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listResultsOverview } from "@/lib/data/results";
import { RecalculateButton } from "@/components/admin/RecalculateButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from "@/lib/status-labels";
import type { SubmissionStatus } from "@prisma/client";

function statusCell(status: string | null) {
  if (!status) return <span className="text-brand-700">—</span>;
  const s = status as SubmissionStatus;
  return <StatusBadge label={SUBMISSION_STATUS_LABEL[s]} tone={SUBMISSION_STATUS_TONE[s]} />;
}

export default async function AdminResultsPage() {
  await requireAdmin();
  const rows = await listResultsOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Results</h1>
        <p className="mt-1 text-brand-700">
          Inspect team submissions and calculated scores. Only Round 2 is
          scored. Scores are calculated from the currently ACTIVE scoring
          model and are never shown to teams.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <RecalculateButton roundSlug="round-2" label="Recalculate Round 2 scores" />
        {/* Plain <a>, not <Link>: this is a file download from a Route
            Handler, not a page navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/admin/results/export"
          className="self-start rounded-md border border-brand-800 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-brand-700">
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold">Round 1 status</th>
              <th className="px-4 py-3 font-semibold">Round 2 status</th>
              <th className="px-4 py-3 font-semibold">Round 2 score</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-700">
                  No teams yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.teamId} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold text-brand-950">{row.teamName}</td>
                  <td className="px-4 py-3">{statusCell(row.round1Status)}</td>
                  <td className="px-4 py-3">{statusCell(row.round2Status)}</td>
                  <td className="px-4 py-3 text-brand-950">{row.round2Score ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/results/${row.teamId}`} className="font-semibold text-brand-800 hover:underline">
                      Details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
