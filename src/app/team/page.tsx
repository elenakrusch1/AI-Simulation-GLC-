import Link from "next/link";
import { requireTeam } from "@/lib/auth/guards";
import { getTeamDashboard } from "@/lib/data/dashboard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buttonClasses } from "@/components/ui/Button";
import { ROUND_STATUS_LABEL, ROUND_STATUS_TONE, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from "@/lib/status-labels";

function actionFor(round: {
  slug: string;
  status: string;
  editingAllowed: boolean;
  submissionStatus: string | null;
}) {
  const href = `/${round.slug === "round-1" ? "team/round-1" : "team/round-2"}`;
  if (round.submissionStatus === "SUBMITTED" || round.submissionStatus === "LOCKED") {
    return { label: "View submission", href };
  }
  if (round.status === "OPEN" && round.editingAllowed) {
    return { label: round.submissionStatus === "DRAFT" ? "Continue" : "Start", href };
  }
  return null;
}

export default async function TeamDashboardPage() {
  const session = await requireTeam();
  if (!session.teamId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-brand-700">No team is associated with this account.</p>
      </div>
    );
  }

  const dashboard = await getTeamDashboard(session.teamId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Welcome, {dashboard.teamName}</h1>
        <p className="mt-1 text-brand-700">
          Track your rounds below.{" "}
          <Link href="/leaderboard" className="font-semibold text-brand-800 hover:underline">
            View the published leaderboard →
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dashboard.rounds.map((round) => {
          const action = actionFor(round);
          return (
            <div key={round.slug} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-brand-950">{round.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge label={ROUND_STATUS_LABEL[round.status]} tone={ROUND_STATUS_TONE[round.status]} />
                {round.submissionStatus ? (
                  <StatusBadge
                    label={SUBMISSION_STATUS_LABEL[round.submissionStatus as "DRAFT" | "SUBMITTED" | "LOCKED"]}
                    tone={SUBMISSION_STATUS_TONE[round.submissionStatus as "DRAFT" | "SUBMITTED" | "LOCKED"]}
                  />
                ) : null}
              </div>
              <div className="mt-4">
                {action ? (
                  <Link href={action.href} className={buttonClasses()}>
                    {action.label}
                  </Link>
                ) : (
                  <p className="text-sm text-brand-700">Not currently available.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-brand-700">
        Looking for what you submitted before?{" "}
        <Link href="/team/history" className="font-semibold text-brand-800 hover:underline">
          View your submission history →
        </Link>
      </p>
    </div>
  );
}
