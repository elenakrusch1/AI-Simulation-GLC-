import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// Absolute session lifetime and rolling-rotation window. A session
// token is re-issued (new random token, new DB row content, same
// row id) once it has been alive for longer than the rotate window,
// on any authenticated request — this is the "session rotation" the
// brief asks for, without needing sticky per-request rotation.
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours
const SESSION_ROTATE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface SessionUser {
  sessionId: string;
  userId: string;
  role: Role;
  loginIdentifier: string;
  teamId: string | null;
  teamName: string | null;
}

interface SessionMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
  return { token, expiresAt };
}

export interface VerifySessionResult {
  user: SessionUser;
  rotated?: { token: string; expiresAt: Date };
}

/**
 * Look up a session by its raw cookie token, enforcing expiry and
 * that the underlying account (and, for teams, the team) is still
 * active. Transparently rotates the token when it is due.
 */
export async function verifySessionToken(
  token: string,
): Promise<VerifySessionResult | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { team: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {
      // Already gone — fine.
    });
    return null;
  }

  const { user } = session;
  if (!user.active) return null;
  if (user.role === "TEAM" && (!user.team || !user.team.active)) return null;

  const sessionUser: SessionUser = {
    sessionId: session.id,
    userId: user.id,
    role: user.role,
    loginIdentifier: user.loginIdentifier,
    teamId: user.team?.id ?? null,
    teamName: user.team?.name ?? null,
  };

  const age = Date.now() - session.lastRotatedAt.getTime();
  if (age <= SESSION_ROTATE_AFTER_MS) {
    return { user: sessionUser };
  }

  const newToken = generateSessionToken();
  const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      tokenHash: hashToken(newToken),
      expiresAt: newExpiresAt,
      lastRotatedAt: new Date(),
    },
  });

  return { user: sessionUser, rotated: { token: newToken, expiresAt: newExpiresAt } };
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Revoke every session for a user — used when an admin deactivates an account. */
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/** Best-effort cleanup of expired session rows. Safe to call opportunistically. */
export async function purgeExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
}
