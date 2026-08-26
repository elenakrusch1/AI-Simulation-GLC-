"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import {
  openRound,
  closeRound,
  lockRound,
  setEditingAllowed,
  RoundTransitionError,
} from "@/lib/data/rounds";

const roundIdSchema = z.object({ roundId: z.string().uuid() });

async function runTransition(
  formData: FormData,
  action: string,
  transition: (roundId: string) => Promise<{ id: string; status: string; editingAllowed: boolean }>,
): Promise<void> {
  const admin = await requireAdmin();
  const parsed = roundIdSchema.safeParse({ roundId: formData.get("roundId") });
  if (!parsed.success) return;

  try {
    const round = await transition(parsed.data.roundId);
    await writeAuditLog({
      userId: admin.userId,
      action,
      entityType: "Round",
      entityId: round.id,
      newValue: { status: round.status, editingAllowed: round.editingAllowed },
    });
  } catch (error) {
    if (error instanceof RoundTransitionError) {
      // Invalid transition attempted (e.g. a stale button after
      // someone else already changed the round's state). Nothing to
      // roll back — just skip silently and let the page re-render
      // the current, authoritative state.
      return;
    }
    throw error;
  }

  revalidatePath("/admin/rounds");
}

export async function openRoundAction(formData: FormData): Promise<void> {
  await runTransition(formData, "ROUND_OPENED", openRound);
}

export async function closeRoundAction(formData: FormData): Promise<void> {
  await runTransition(formData, "ROUND_CLOSED", closeRound);
}

export async function lockRoundAction(formData: FormData): Promise<void> {
  await runTransition(formData, "ROUND_LOCKED", lockRound);
}

export async function pauseEditingAction(formData: FormData): Promise<void> {
  await runTransition(formData, "ROUND_EDITING_PAUSED", (id) => setEditingAllowed(id, false));
}

export async function resumeEditingAction(formData: FormData): Promise<void> {
  await runTransition(formData, "ROUND_EDITING_RESUMED", (id) => setEditingAllowed(id, true));
}
