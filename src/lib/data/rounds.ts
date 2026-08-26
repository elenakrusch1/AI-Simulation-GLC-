import "server-only";
import { prisma } from "@/lib/prisma";
import type { Round } from "@prisma/client";

export class RoundTransitionError extends Error {}

export async function listRoundsForAdmin() {
  return prisma.round.findMany({ orderBy: { number: "asc" } });
}

export async function getRoundBySlug(slug: string) {
  return prisma.round.findUnique({ where: { slug } });
}

function assertTransition(condition: boolean, message: string): void {
  if (!condition) throw new RoundTransitionError(message);
}

/** NOT_STARTED or CLOSED -> OPEN. */
export async function openRound(roundId: string): Promise<Round> {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  assertTransition(
    round.status === "NOT_STARTED" || round.status === "CLOSED",
    `Round "${round.name}" cannot be opened from status ${round.status}.`,
  );
  return prisma.round.update({
    where: { id: roundId },
    data: {
      status: "OPEN",
      editingAllowed: true,
      openedAt: round.openedAt ?? new Date(),
    },
  });
}

/** OPEN -> CLOSED. */
export async function closeRound(roundId: string): Promise<Round> {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  assertTransition(
    round.status === "OPEN",
    `Round "${round.name}" cannot be closed from status ${round.status}.`,
  );
  return prisma.round.update({
    where: { id: roundId },
    data: { status: "CLOSED", editingAllowed: false, closedAt: new Date() },
  });
}

/** CLOSED -> LOCKED (terminal — no unlock action). */
export async function lockRound(roundId: string): Promise<Round> {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  assertTransition(
    round.status === "CLOSED",
    `Round "${round.name}" cannot be locked from status ${round.status}.`,
  );
  return prisma.round.update({
    where: { id: roundId },
    data: { status: "LOCKED", editingAllowed: false, lockedAt: new Date() },
  });
}

/** Pause/resume editing without changing status — only meaningful while OPEN. */
export async function setEditingAllowed(roundId: string, editingAllowed: boolean): Promise<Round> {
  const round = await prisma.round.findUniqueOrThrow({ where: { id: roundId } });
  assertTransition(
    round.status === "OPEN",
    `Editing can only be paused or resumed while a round is OPEN (round "${round.name}" is ${round.status}).`,
  );
  return prisma.round.update({ where: { id: roundId }, data: { editingAllowed } });
}
