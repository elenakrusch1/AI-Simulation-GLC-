import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { listResultsOverview } from "@/lib/data/results";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

function csvField(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  // Route Handlers are not covered by a page/layout guard — this
  // route enforces admin access itself, same as every other
  // sensitive server code path.
  const admin = await requireAdmin();

  const rows = await listResultsOverview();
  const adjustmentTotals = await prisma.manualScoreAdjustment.groupBy({
    by: ["teamId"],
    _sum: { amount: true },
  });
  const adjustmentByTeam = new Map(adjustmentTotals.map((a) => [a.teamId, a._sum.amount ?? 0]));

  const header = [
    "Team",
    "Round 1 status",
    "Round 1 score",
    "Round 2 status",
    "Round 2 score",
    "Manual adjustment total",
  ];
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.teamName,
        row.round1Status,
        row.round1Score,
        row.round2Status,
        row.round2Score,
        adjustmentByTeam.get(row.teamId) ?? 0,
      ]
        .map(csvField)
        .join(","),
    );
  }
  const csv = lines.join("\r\n") + "\r\n";

  await writeAuditLog({
    userId: admin.userId,
    action: "RESULTS_EXPORTED",
    entityType: "Results",
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="results-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
