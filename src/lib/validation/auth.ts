import { z } from "zod";

export const teamLoginSchema = z.object({
  teamCode: z
    .string()
    .trim()
    .min(1, "Team code is required")
    .max(100, "Team code is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(200, "Password is too long"),
});

export const adminLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or admin username is required")
    .max(200, "Value is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(200, "Password is too long"),
});

export type TeamLoginInput = z.infer<typeof teamLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
