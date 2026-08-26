import "server-only";
import { prisma } from "@/lib/prisma";

export async function listLeaderboardPublications() {
  return prisma.leaderboardPublication.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      publishedByUser: { select: { loginIdentifier: true } },
      _count: { select: { entries: true } },
    },
  });
}

/** Public-safe: only rank, team name, and the published score snapshot — never internal scoring detail. */
export async function getLatestVisibleLeaderboard() {
  return prisma.leaderboardPublication.findFirst({
    where: { visible: true },
    orderBy: { publishedAt: "desc" },
    include: {
      entries: {
        orderBy: { rank: "asc" },
        select: { rank: true, publishedScore: true, tied: true, team: { select: { name: true } } },
      },
    },
  });
}

export async function toggleLeaderboardVisibility(id: string, visible: boolean) {
  return prisma.leaderboardPublication.update({ where: { id }, data: { visible } });
}

interface PublishInput {
  title: string;
  roundIds: string[];
  publishedByUserId: string;
}

/**
 * A publication is an immutable snapshot: totals are computed once,
 * at publish time, from calculated scores (active scoring model) plus
 * any manual adjustments for the included rounds (or team-wide
 * adjustments). Re-running scoring later never mutates a past
 * publication — publish again to create a new one.
 */
export async function publishLeaderboard(input: PublishInput) {
  const activeModel = await prisma.scoringModelVersion.findFirst({ where: { status: "ACTIVE" } });
  const teams = await prisma.team.findMany({ where: { active: true }, select: { id: true } });

  const [scoreResults, adjustments] = await Promise.all([
    activeModel
      ? prisma.scoreResult.findMany({
          where: { scoringModelVersionId: activeModel.id, roundId: { in: input.roundIds } },
          select: { teamId: true, calculatedScore: true },
        })
      : Promise.resolve([]),
    prisma.manualScoreAdjustment.findMany({
      where: { OR: [{ roundId: { in: input.roundIds } }, { roundId: null }] },
      select: { teamId: true, amount: true },
    }),
  ]);

  const totals = teams.map((team) => {
    const score = scoreResults.filter((r) => r.teamId === team.id).reduce((sum, r) => sum + r.calculatedScore, 0);
    const adjustment = adjustments.filter((a) => a.teamId === team.id).reduce((sum, a) => sum + a.amount, 0);
    return { teamId: team.id, total: score + adjustment };
  });

  const sorted = [...totals].sort((a, b) => b.total - a.total);
  const entries: { teamId: string; rank: number; publishedScore: number }[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;
  sorted.forEach((t, index) => {
    const rank = lastScore !== null && t.total === lastScore ? lastRank : index + 1;
    entries.push({ teamId: t.teamId, rank, publishedScore: t.total });
    lastScore = t.total;
    lastRank = rank;
  });
  const rankCounts = new Map<number, number>();
  for (const e of entries) rankCounts.set(e.rank, (rankCounts.get(e.rank) ?? 0) + 1);

  return prisma.$transaction(async (tx) => {
    const publication = await tx.leaderboardPublication.create({
      data: {
        title: input.title,
        visible: true,
        frozen: true,
        includedRounds: input.roundIds,
        publishedByUserId: input.publishedByUserId,
      },
    });
    if (entries.length) {
      await tx.leaderboardEntry.createMany({
        data: entries.map((e) => ({
          publicationId: publication.id,
          teamId: e.teamId,
          rank: e.rank,
          publishedScore: e.publishedScore,
          tied: (rankCounts.get(e.rank) ?? 0) > 1,
        })),
      });
    }
    return publication;
  });
}
