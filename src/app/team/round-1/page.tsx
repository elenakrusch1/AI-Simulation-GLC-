import { requireTeam } from "@/lib/auth/guards";
import { getTeamRoundOneView } from "@/lib/data/submissions";
import { listActiveCustomers } from "@/lib/data/reference";
import { RoundOneForm } from "@/components/team/RoundOneForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUND_STATUS_LABEL, ROUND_STATUS_TONE } from "@/lib/status-labels";

export default async function TeamRoundOnePage() {
  const session = await requireTeam();
  if (!session.teamId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-brand-700">No team is associated with this account.</p>
      </div>
    );
  }

  const view = await getTeamRoundOneView(session.teamId);

  if (!view.round) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-brand-950">Round 1 — Customer Selection</h1>
        <p className="mt-2 text-brand-700">Round 1 has not been configured yet.</p>
      </div>
    );
  }

  const alreadySubmitted = view.submissionStatus === "SUBMITTED" || view.submissionStatus === "LOCKED";
  const canEdit =
    view.round.status === "OPEN" && view.round.editingAllowed && !alreadySubmitted;

  const customers = canEdit ? await listActiveCustomers() : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Round 1 — {view.round.name}</h1>
        <div className="mt-2">
          <StatusBadge label={ROUND_STATUS_LABEL[view.round.status]} tone={ROUND_STATUS_TONE[view.round.status]} />
        </div>
      </div>

      {alreadySubmitted && view.decision ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="rounded-md bg-status-open-bg px-3 py-2 text-status-open" role="status">
            Your Round 1 decisions have been submitted.
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-brand-700">Primary customer</dt>
              <dd className="text-brand-950">{view.decision.primaryCustomerName}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-brand-700">Secondary customer</dt>
              <dd className="text-brand-950">{view.decision.secondaryCustomerName}</dd>
            </div>
            {view.decision.rationale ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-brand-700">Team rationale</dt>
                <dd className="whitespace-pre-wrap text-brand-950">{view.decision.rationale}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : canEdit ? (
        <RoundOneForm
          customers={customers}
          initialPrimaryCustomerId={view.decision?.primaryCustomerId ?? ""}
          initialSecondaryCustomerId={view.decision?.secondaryCustomerId ?? ""}
          initialRationale={view.decision?.rationale ?? ""}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-brand-700">
            Round 1 is not currently open for decisions. Check back once the
            moderation team opens it.
          </p>
        </div>
      )}
    </div>
  );
}
