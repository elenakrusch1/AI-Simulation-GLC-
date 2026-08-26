import { requireAdmin } from "@/lib/auth/guards";
import { listRoundsForAdmin } from "@/lib/data/rounds";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ROUND_STATUS_LABEL, ROUND_STATUS_TONE } from "@/lib/status-labels";
import {
  openRoundAction,
  closeRoundAction,
  lockRoundAction,
  pauseEditingAction,
  resumeEditingAction,
} from "./actions";

function formatDate(value: Date | null): string {
  return value ? value.toLocaleString() : "—";
}

export default async function AdminRoundsPage() {
  await requireAdmin();
  const rounds = await listRoundsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Rounds</h1>
        <p className="mt-1 text-brand-700">
          Open a round to let teams submit decisions, close it when
          submissions should stop, and lock it once results are final.
          Locking is permanent.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rounds.map((round) => (
          <div key={round.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-brand-950">
                  Round {round.number} — {round.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge label={ROUND_STATUS_LABEL[round.status]} tone={ROUND_STATUS_TONE[round.status]} />
                  <span className="text-sm text-brand-700">
                    Editing {round.editingAllowed ? "allowed" : "paused"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(round.status === "NOT_STARTED" || round.status === "CLOSED") && (
                  <form action={openRoundAction}>
                    <input type="hidden" name="roundId" value={round.id} />
                    <Button type="submit" className="px-3 py-1.5 text-sm">
                      {round.status === "CLOSED" ? "Reopen round" : "Open round"}
                    </Button>
                  </form>
                )}
                {round.status === "OPEN" && (
                  <>
                    <form action={closeRoundAction}>
                      <input type="hidden" name="roundId" value={round.id} />
                      <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">
                        Close round
                      </Button>
                    </form>
                    {round.editingAllowed ? (
                      <form action={pauseEditingAction}>
                        <input type="hidden" name="roundId" value={round.id} />
                        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">
                          Pause editing
                        </Button>
                      </form>
                    ) : (
                      <form action={resumeEditingAction}>
                        <input type="hidden" name="roundId" value={round.id} />
                        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">
                          Resume editing
                        </Button>
                      </form>
                    )}
                  </>
                )}
                {round.status === "CLOSED" && (
                  <form action={lockRoundAction}>
                    <input type="hidden" name="roundId" value={round.id} />
                    <Button type="submit" variant="danger" className="px-3 py-1.5 text-sm">
                      Lock round
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-brand-700 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-brand-900">Opened</dt>
                <dd>{formatDate(round.openedAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-900">Closed</dt>
                <dd>{formatDate(round.closedAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-900">Locked</dt>
                <dd>{formatDate(round.lockedAt)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
