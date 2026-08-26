import { z } from "zod";

// Shared minimum bar for any password this app issues or accepts on
// creation (first admin via CLI seed, admin-created team accounts,
// admin-created admin accounts). Login itself never enforces this —
// only creation/reset paths do.
export const passwordPolicySchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(200, "Password is too long")
  .refine((value) => /[A-Za-z]/.test(value), "Password must contain at least one letter")
  .refine((value) => /[0-9]/.test(value), "Password must contain at least one number");
