// Deliberately no `server-only` import here: this module is also used
// directly (outside the Next.js request/bundling context) by the
// database seed scripts (prisma/seed.ts, scripts/seed-admin.ts) to
// hash the seeded/admin passwords with the exact same algorithm the
// app verifies against.
import bcrypt from "bcryptjs";

// Cost factor 12 is a reasonable balance of hashing time vs. server
// load for an interactive login form as of 2026 hardware.
const BCRYPT_COST = 12;

// A fixed, precomputed hash compared against when no matching account
// exists, so a "no such account" lookup takes roughly the same amount
// of time as a "wrong password" comparison. Without this, response
// timing alone could reveal whether a team code or admin identifier
// exists.
const DUMMY_HASH = bcrypt.hashSync(
  "dummy-password-used-only-for-constant-time-comparison",
  BCRYPT_COST,
);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Verify a candidate password. Pass `hash: null` when no account was
 * found — this still performs a comparison (against a dummy hash) so
 * the caller's timing profile doesn't leak account existence.
 */
export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
