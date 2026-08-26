import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listAuditLogForAdmin } from "@/lib/data/audit";

function formatJson(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  await requireAdmin();
  const { cursor } = await searchParams;
  const { entries, nextCursor } = await listAuditLogForAdmin(cursor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-brand-950">Audit log</h1>
        <p className="mt-1 text-brand-700">
          Every login and every administrative change is recorded here,
          most recent first.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-brand-700">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-brand-700">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-brand-700">
                    {entry.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-brand-950">
                    {entry.user ? `${entry.user.loginIdentifier} (${entry.user.role})` : "System"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-950">{entry.action}</td>
                  <td className="px-4 py-3 text-brand-700">
                    {entry.entityType}
                    {entry.entityId ? ` #${entry.entityId.slice(0, 8)}` : ""}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-brand-700">
                    {entry.reason ? <div>{entry.reason}</div> : null}
                    {formatJson(entry.previousValue) ? (
                      <div className="truncate">before: {formatJson(entry.previousValue)}</div>
                    ) : null}
                    {formatJson(entry.newValue) ? (
                      <div className="truncate">after: {formatJson(entry.newValue)}</div>
                    ) : null}
                    {entry.ipAddress ? <div>ip: {entry.ipAddress}</div> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {nextCursor ? (
        <Link
          href={`/admin/audit-log?cursor=${nextCursor}`}
          className="self-start rounded-md border border-brand-800 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Load more
        </Link>
      ) : null}
    </div>
  );
}
