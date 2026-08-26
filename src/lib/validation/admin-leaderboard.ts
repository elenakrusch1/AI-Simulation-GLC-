import { z } from "zod";

export const publishLeaderboardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  roundIds: z.array(z.string().uuid()).min(1, "Select at least one round to include"),
});

export const toggleVisibilitySchema = z.object({
  publicationId: z.string().uuid(),
  visible: z.enum(["true", "false"]).transform((v) => v === "true"),
});
