import { getLatestVisibleLeaderboard } from "@/lib/data/leaderboard";

// Force dynamic (per-request) rendering: this page has no auth check
// to otherwise opt it out of static generation, but it reads live
// data from the database. Without this, Next would try to prerender
// it once at build time — failing the build wherever the DB isn't
// reachable during `next build` (e.g. this project's own Docker
// build), and, worse, baking in a permanently stale snapshot even
// when the build DOES have DB access at build time.
export const dynamic = "force-dynamic";

// Public route — no auth guard. Only ever reads the latest VISIBLE
// LeaderboardPublication's rank/team/published-score snapshot; never
// touches ScoringRule, ScoreBreakdown, or any other internal model.
export default async function LeaderboardPage() {
  const publication = await getLatestVisibleLeaderboard();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-950">
        Data Center Deal Simulation — Leaderboard
      </h1>

      {!publication ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-brand-700">
            No leaderboard has been published yet. Check back after the
            moderation team publishes results.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-brand-950">{publication.title}</h2>
            <p className="text-sm text-brand-700">
              Published {publication.publishedAt.toLocaleString()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="border-b border-slate-300 text-sm text-brand-700">
                  <th className="px-6 py-3 font-semibold">Rank</th>
                  <th className="px-6 py-3 font-semibold">Team</th>
                  <th className="px-6 py-3 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {publication.entries.map((entry, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="px-6 py-3 text-brand-950">
                      {entry.rank}
                      {entry.tied ? <span className="ml-1 text-xs text-brand-700">(tie)</span> : null}
                    </td>
                    <td className="px-6 py-3 text-brand-950">{entry.team.name}</td>
                    <td className="px-6 py-3 text-brand-950">{entry.publishedScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
