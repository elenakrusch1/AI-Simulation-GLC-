"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { collectFieldErrors } from "@/lib/form-errors";
import { publishLeaderboard, toggleLeaderboardVisibility } from "@/lib/data/leaderboard";
import { publishLeaderboardSchema, toggleVisibilitySchema } from "@/lib/validation/admin-leaderboard";

export interface PublishFormState {
  fieldErrors?: Record<string, string>;
  formError?: string;
  success?: string;
}

export async function publishLeaderboardAction(
  _prevState: PublishFormState,
  formData: FormData,
): Promise<PublishFormState> {
  const admin = await requireAdmin();
  const parsed = publishLeaderboardSchema.safeParse({
    title: formData.get("title"),
    roundIds: formData.getAll("roundIds"),
  });
  if (!parsed.success) return { fieldErrors: collectFieldErrors(parsed.error) };

  const publication = await publishLeaderboard({
    title: parsed.data.title,
    roundIds: parsed.data.roundIds,
    publishedByUserId: admin.userId,
  });
  await writeAuditLog({
    userId: admin.userId,
    action: "LEADERBOARD_PUBLISHED",
    entityType: "LeaderboardPublication",
    entityId: publication.id,
    newValue: { title: publication.title, includedRounds: parsed.data.roundIds },
  });

  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  return { success: `Published "${publication.title}".` };
}

export async function toggleLeaderboardVisibilityAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = toggleVisibilitySchema.safeParse({
    publicationId: formData.get("publicationId"),
    visible: formData.get("visible"),
  });
  if (!parsed.success) return;

  const publication = await toggleLeaderboardVisibility(parsed.data.publicationId, parsed.data.visible);
  await writeAuditLog({
    userId: admin.userId,
    action: publication.visible ? "LEADERBOARD_SHOWN" : "LEADERBOARD_HIDDEN",
    entityType: "LeaderboardPublication",
    entityId: publication.id,
  });

  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
}
