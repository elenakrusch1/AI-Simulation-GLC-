import { z } from "zod";

// teamCodeSchema/teamNameSchema are shared by public self-registration
// (src/app/register) and admin-side team editing (src/app/admin/teams)
// — teams have no password (see src/lib/data/teams.ts).

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

export const registerTeamSchema = z.object({
  name: teamNameSchema,
  code: teamCodeSchema,
});

export const updateTeamSchema = z.object({
  teamId: idSchema,
  name: teamNameSchema,
  code: teamCodeSchema,
});

export const setTeamActiveSchema = z.object({
  teamId: idSchema,
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type RegisterTeamInput = z.infer<typeof registerTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
