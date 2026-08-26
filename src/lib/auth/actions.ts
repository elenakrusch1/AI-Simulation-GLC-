"use server";

import { redirect } from "next/navigation";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";
import { destroySessionByToken, verifySessionToken } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";

export async function logoutAction(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    const result = await verifySessionToken(token);
    await destroySessionByToken(token);
    await clearSessionCookie();
    if (result) {
      await writeAuditLog({
        userId: result.user.userId,
        action: "LOGOUT",
        entityType: "User",
        entityId: result.user.userId,
      });
    }
  }
  redirect("/login");
}
