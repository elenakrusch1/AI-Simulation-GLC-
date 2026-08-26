import { z } from "zod";
import { passwordPolicySchema } from "@/lib/validation/password-policy";

const teamCodeSchema = z
  .string()
  .trim()
  .min(2, "Team code must be at least 2 characters")
  .max(50, "Team code is too long")
  .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, and underscores");

const teamNameSchema = z
  .string()
  .trim()
  .min(1, "Team name is required")
  .max(200, "Team name is too long");

const idSchema = z.string().uuid("Invalid identifier");

export const createTeamSchema = z.object({
  name: teamNameSchema,
  code: teamCodeSchema,
  password: passwordPolicySchema,
});

export const updateTeamSchema = z.object({
  teamId: idSchema,
  name: teamNameSchema,
  code: teamCodeSchema,
});

export const resetTeamPasswordSchema = z.object({
  teamId: idSchema,
  password: passwordPolicySchema,
});

export const setTeamActiveSchema = z.object({
  teamId: idSchema,
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
