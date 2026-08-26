import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Every audit row is written by an authenticated, attributable
 * action (login, logout, or an admin mutation) — never for
 * anonymous/failed login attempts, which are unauthenticated and
 * attacker-controlled in volume (those are instead throttled via
 * User.failedLoginCount / lockedUntil, see rate-limit.ts).
 */
export interface AuditEntry {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  reason?: string | null;
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const ipAddress = await getClientIp();
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      previousValue: entry.previousValue ?? undefined,
      newValue: entry.newValue ?? undefined,
      reason: entry.reason ?? null,
      ipAddress,
    },
  });
}
