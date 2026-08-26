import { z } from "zod";

/**
 * Fail fast on missing/malformed configuration instead of limping along
 * with `undefined` values that surface as confusing runtime errors later
 * (e.g. inside a Docker container with a typo'd env var).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().default("3000"),
  SESSION_COOKIE_NAME: z.string().default("dcsim_session"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Lazily validated so this module can be imported by client bundles
 * (e.g. via shared type-only imports) without throwing — the actual
 * parse only runs when a server context calls getEnv().
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
