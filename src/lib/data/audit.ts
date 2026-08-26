import "server-only";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

export async function listAuditLogForAdmin(cursor?: string) {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      reason: true,
      ipAddress: true,
      createdAt: true,
      previousValue: true,
      newValue: true,
      user: { select: { loginIdentifier: true, role: true } },
    },
  });

  const hasMore = entries.length > PAGE_SIZE;
  return {
    entries: hasMore ? entries.slice(0, PAGE_SIZE) : entries,
    nextCursor: hasMore ? entries[PAGE_SIZE - 1]?.id ?? null : null,
  };
}
