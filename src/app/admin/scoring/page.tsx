import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listScoringModelVersions } from "@/lib/data/scoring";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CreateScoringVersionForm } from "@/components/admin/CreateScoringVersionForm";
import type { BadgeTone } from "@/lib/status-labels";

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "draft",
  ACTIVE: "open",
  ARCHIVED: "locked",
};

export default async function AdminScoringPage() {
  await requireAdmin();
  const versions = await listScoringModelVersions();
  const hasActive = versions.some((v) => v.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Scoring</h1>
        <p className="mt-1 text-brand-700">
          Scoring rules are never invented by the application — this list
          starts empty and only what you enter here is ever used to
          calculate results. At most one version is ACTIVE at a time.
        </p>
        {!hasActive ? (
          <p className="mt-2 rounded-md bg-status-closed-bg px-3 py-2 text-sm text-status-closed">
            No scoring model is currently active — results will calculate to
            zero until one is.
          </p>
        ) : null}
      </div>

      <CreateScoringVersionForm />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-brand-950">Scoring model versions</h2>
        {versions.length === 0 ? (
          <p className="text-brand-700">No scoring model versions yet — create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-slate-300 text-sm text-brand-700">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Rules</th>
                  <th className="py-2 pr-4 font-semibold">Created by</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-brand-950">{version.name}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={version.status} tone={STATUS_TONE[version.status] ?? "neutral"} />
                    </td>
                    <td className="py-3 pr-4 text-brand-700">{version._count.rules}</td>
                    <td className="py-3 pr-4 text-brand-700">{version.createdByUser.loginIdentifier}</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/scoring/${version.id}`}
                        className="text-sm font-semibold text-brand-800 hover:underline"
                      >
                        Manage rules →
                      </Link>
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
