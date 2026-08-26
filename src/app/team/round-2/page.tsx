import { requireTeam } from "@/lib/auth/guards";
import { getTeamRoundTwoView } from "@/lib/data/submissions";
import { listActiveTechnicalSolutions, listActiveCommercialModels } from "@/lib/data/reference";
import { RoundTwoForm } from "@/components/team/RoundTwoForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUND_STATUS_LABEL, ROUND_STATUS_TONE } from "@/lib/status-labels";

export default async function TeamRoundTwoPage() {
  const session = await requireTeam();
  if (!session.teamId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-brand-700">No team is associated with this account.</p>
      </div>
    );
  }

  const view = await getTeamRoundTwoView(session.teamId);

  if (!view.roundOneFinalized) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-brand-950">Round 2 — Offer Design</h1>
        <p className="mt-2 text-brand-700">
          Round 2 becomes available once your Round 1 decisions have been
          finally submitted.
        </p>
      </div>
    );
  }

  if (!view.round) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-brand-950">Round 2 — Offer Design</h1>
        <p className="mt-2 text-brand-700">Round 2 has not been configured yet.</p>
      </div>
    );
  }

  const alreadySubmitted = view.submissionStatus === "SUBMITTED" || view.submissionStatus === "LOCKED";
  const canEdit = view.round.status === "OPEN" && view.round.editingAllowed && !alreadySubmitted;

  const [technicalSolutions, commercialModels] = canEdit
    ? await Promise.all([listActiveTechnicalSolutions(), listActiveCommercialModels()])
    : [[], []];

  const primaryAssignment = view.roundOneCustomers?.find((c) => c.role === "PRIMARY");
  const secondaryAssignment = view.roundOneCustomers?.find((c) => c.role === "SECONDARY");
  const primaryDecision = view.decisions.find((d) => d.customerRole === "PRIMARY");
  const secondaryDecision = view.decisions.find((d) => d.customerRole === "SECONDARY");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Round 2 — {view.round.name}</h1>
        <div className="mt-2">
          <StatusBadge label={ROUND_STATUS_LABEL[view.round.status]} tone={ROUND_STATUS_TONE[view.round.status]} />
        </div>
      </div>

      {alreadySubmitted ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-md bg-status-open-bg px-3 py-2 text-status-open" role="status">
            Your Round 2 decisions have been submitted.
          </p>
          {[primaryDecision, secondaryDecision].map((decision) =>
            decision ? (
              <div key={decision.customerRole} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-brand-950">
                  {decision.customerRole === "PRIMARY" ? "Primary customer" : "Secondary customer"} —{" "}
                  {decision.customerName}
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-brand-700">Technical solution</dt>
                    <dd className="text-brand-950">{decision.technicalSolutionName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-brand-700">Commercial model</dt>
                    <dd className="text-brand-950">{decision.commercialModelName}</dd>
                  </div>
                  {decision.rationale ? (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-semibold text-brand-700">Rationale</dt>
                      <dd className="whitespace-pre-wrap text-brand-950">{decision.rationale}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null,
          )}
        </div>
      ) : canEdit && primaryAssignment && secondaryAssignment ? (
        <RoundTwoForm
          primary={{
            role: "PRIMARY",
            customerId: primaryAssignment.customerId,
            customerName: primaryAssignment.customerName,
            initialTechnicalSolutionId: primaryDecision?.technicalSolutionId ?? "",
            initialCommercialModelId: primaryDecision?.commercialModelId ?? "",
            initialRationale: primaryDecision?.rationale ?? "",
          }}
          secondary={{
            role: "SECONDARY",
            customerId: secondaryAssignment.customerId,
            customerName: secondaryAssignment.customerName,
            initialTechnicalSolutionId: secondaryDecision?.technicalSolutionId ?? "",
            initialCommercialModelId: secondaryDecision?.commercialModelId ?? "",
            initialRationale: secondaryDecision?.rationale ?? "",
          }}
          technicalSolutions={technicalSolutions}
          commercialModels={commercialModels}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-brand-700">
            Round 2 is not currently open for decisions. Check back once the
            moderation team opens it.
          </p>
        </div>
      )}
    </div>
  );
}
