import { requireAdmin } from "@/lib/auth/guards";
import { listLeaderboardPublications } from "@/lib/data/leaderboard";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { PublishLeaderboardForm } from "@/components/admin/PublishLeaderboardForm";
import { toggleLeaderboardVisibilityAction } from "./actions";

export default async function AdminLeaderboardPage() {
  await requireAdmin();
  const [publications, rounds] = await Promise.all([
    listLeaderboardPublications(),
    prisma.round.findMany({ orderBy: { number: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Leaderboard publication</h1>
        <p className="mt-1 text-brand-700">
          Each publish creates an immutable snapshot of team rankings from
          currently calculated scores. Only visible, published snapshots
          appear on the public leaderboard.
        </p>
      </div>

      <PublishLeaderboardForm rounds={rounds} />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-950">Past publications</h2>
        {publications.length === 0 ? (
          <p className="text-brand-700">Nothing published yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-brand-700">
                  <th className="py-2 pr-4 font-semibold">Title</th>
                  <th className="py-2 pr-4 font-semibold">Published</th>
                  <th className="py-2 pr-4 font-semibold">Entries</th>
                  <th className="py-2 pr-4 font-semibold">Visibility</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {publications.map((pub) => (
                  <tr key={pub.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-brand-950">{pub.title}</td>
                    <td className="py-3 pr-4 text-brand-700">
                      {pub.publishedAt.toLocaleString()} by {pub.publishedByUser.loginIdentifier}
                    </td>
                    <td className="py-3 pr-4 text-brand-700">{pub._count.entries}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={pub.visible ? "Visible" : "Hidden"} tone={pub.visible ? "open" : "locked"} />
                    </td>
                    <td className="py-3">
                      <form action={toggleLeaderboardVisibilityAction}>
                        <input type="hidden" name="publicationId" value={pub.id} />
                        <input type="hidden" name="visible" value={(!pub.visible).toString()} />
                        <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                          {pub.visible ? "Hide" : "Show"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
