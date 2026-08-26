import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { ROUND_STATUS_LABEL } from "@/lib/status-labels";

export default async function AdminOverviewPage() {
  const session = await requireAdmin();

  const [teamCount, activeTeamCount, rounds, activeScoringModel] = await Promise.all([
    prisma.team.count(),
    prisma.team.count({ where: { active: true } }),
    prisma.round.findMany({ orderBy: { number: "asc" }, select: { name: true, status: true } }),
    prisma.scoringModelVersion.findFirst({ where: { status: "ACTIVE" }, select: { name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Welcome, {session.loginIdentifier}</h1>
        <p className="mt-1 text-brand-700">Moderation overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/teams" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-600">
          <p className="text-sm font-semibold text-brand-700">Teams</p>
          <p className="mt-1 text-2xl font-bold text-brand-950">{activeTeamCount} / {teamCount}</p>
          <p className="text-sm text-brand-700">active</p>
        </Link>
        <Link href="/admin/rounds" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-600">
          <p className="text-sm font-semibold text-brand-700">Rounds</p>
          <ul className="mt-1 text-sm text-brand-950">
            {rounds.map((r) => (
              <li key={r.name}>
                {r.name}: {ROUND_STATUS_LABEL[r.status]}
              </li>
            ))}
          </ul>
        </Link>
        <Link href="/admin/scoring" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-600">
          <p className="text-sm font-semibold text-brand-700">Active scoring model</p>
          <p className="mt-1 text-lg font-bold text-brand-950">{activeScoringModel?.name ?? "None"}</p>
        </Link>
      </div>
    </div>
  );
}
