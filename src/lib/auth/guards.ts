import "server-only";
import { redirect } from "next/navigation";
import { getSessionCookie, setSessionCookie } from "@/lib/auth/cookies";
import { verifySessionToken, type SessionUser } from "@/lib/auth/session";

/**
 * The single source of truth for "who is signed in". Every protected
 * page/layout/server action calls this (directly or via requireTeam /
 * requireAdmin) — role is always re-derived from the database-backed
 * session on the server, never trusted from a client-supplied value.
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const result = await verifySessionToken(token);
  if (!result) return null;

  if (result.rotated) {
    await setSessionCookie(result.rotated.token, result.rotated.expiresAt);
  }

  return result.user;
}

/** Guard for /team/** server components. Redirects unauthenticated or wrong-role visitors. */
export async function requireTeam(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "TEAM") redirect("/admin");
  return session;
}

/** Guard for /admin/** server components. Redirects unauthenticated or wrong-role visitors. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/team");
  return session;
}
