import "server-only";
import { cookies } from "next/headers";
import { getEnv, isProduction } from "@/lib/env";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

async function cookieName(): Promise<string> {
  return getEnv().SESSION_COOKIE_NAME;
}

export async function setSessionCookie(
  token: string,
  expiresAt?: Date,
): Promise<void> {
  const store = await cookies();
  store.set(await cookieName(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: expiresAt
      ? Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      : SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(await cookieName(), "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(await cookieName())?.value ?? null;
}
