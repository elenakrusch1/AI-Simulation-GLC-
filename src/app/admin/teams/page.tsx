import { requireAdmin } from "@/lib/auth/guards";
import { listTeamsForAdmin } from "@/lib/data/teams";
import { CreateTeamForm } from "@/components/admin/CreateTeamForm";
import { TeamRow } from "@/components/admin/TeamRow";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await listTeamsForAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Teams</h1>
        <p className="mt-1 text-brand-700">
          Create team accounts and manage access. Teams sign in with their
          team code and password — there is no public registration.
        </p>
      </div>

      <CreateTeamForm />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-950">All teams</h2>
        {teams.length === 0 ? (
          <p className="text-brand-700">No teams yet — create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-300 text-sm text-brand-700">
                  <th className="py-2 pr-4 font-semibold">Team</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Last login</th>
                  <th className="py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={{
                      id: team.id,
                      name: team.name,
                      code: team.code,
                      active: team.active,
                      lastLoginAt: team.lastLoginAt?.toISOString() ?? null,
                      locked: team.locked,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
