import { z } from "zod";

// Bar for any password this app issues or accepts on creation
// (admin accounts only — teams have no password, see
// src/lib/data/teams.ts). Login itself never enforces this — only
// creation/reset paths do.
//
// Deliberately relaxed, at the project owner's explicit request, from
// the original 12+ chars/a letter/a number down to just a short
// minimum length, so a memorable password like "nimda" is accepted.
// This weakens admin-credential strength on purpose — don't tighten
// it back up without checking with them first, and don't assume this
// bar is adequate for a deployment anyone untrusted can reach.
export const passwordPolicySchema = z
  .string()
  .min(4, "Password must be at least 4 characters long")
  .max(200, "Password is too long");
