import "server-only";
import { prisma } from "@/lib/prisma";

// DB-backed, per-account login throttling. Deliberately not
// in-memory: the brief requires no persistent state to live only on
// the (ephemeral, single-container-but-possibly-restarted) app
// filesystem, and this also works correctly if the app ever runs as
// more than one replica.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function isAccountLocked(user: { lockedUntil: Date | null }): boolean {
  return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
}

export async function recordFailedLogin(
  userId: string,
  currentFailedCount: number,
): Promise<void> {
  const failedLoginCount = currentFailedCount + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount,
      lockedUntil:
        failedLoginCount >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : undefined,
    },
  });
}

export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
