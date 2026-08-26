import "server-only";
import { prisma } from "@/lib/prisma";

export interface TeamRoundSummary {
  teamId: string;
  teamName: string;
  round1Status: string | null;
  round1Score: number | null;
  round2Status: string | null;
  round2Score: number | null;
}

export async function listResultsOverview(): Promise<TeamRoundSummary[]> {
  const [teams, round1, round2] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.round.findUnique({ where: { slug: "round-1" } }),
    prisma.round.findUnique({ where: { slug: "round-2" } }),
  ]);

  const roundIds = [round1?.id, round2?.id].filter((id): id is string => !!id);
  const activeModel = await prisma.scoringModelVersion.findFirst({ where: { status: "ACTIVE" } });

  const [submissions, scoreResults] = await Promise.all([
    roundIds.length
      ? prisma.submission.findMany({
          where: { roundId: { in: roundIds } },
          select: { teamId: true, roundId: true, status: true },
        })
      : Promise.resolve([]),
    activeModel && roundIds.length
      ? prisma.scoreResult.findMany({
          where: { scoringModelVersionId: activeModel.id, roundId: { in: roundIds } },
          select: { teamId: true, roundId: true, calculatedScore: true },
        })
      : Promise.resolve([]),
  ]);

  return teams.map((team) => {
    const sub1 = submissions.find((s) => s.teamId === team.id && s.roundId === round1?.id);
    const sub2 = submissions.find((s) => s.teamId === team.id && s.roundId === round2?.id);
    const score1 = scoreResults.find((s) => s.teamId === team.id && s.roundId === round1?.id);
    const score2 = scoreResults.find((s) => s.teamId === team.id && s.roundId === round2?.id);
    return {
      teamId: team.id,
      teamName: team.name,
      round1Status: sub1?.status ?? null,
      round1Score: score1?.calculatedScore ?? null,
      round2Status: sub2?.status ?? null,
      round2Score: score2?.calculatedScore ?? null,
    };
  });
}

export async function getTeamResultDetail(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return null;

  const [round1, round2] = await Promise.all([
    prisma.round.findUnique({ where: { slug: "round-1" } }),
    prisma.round.findUnique({ where: { slug: "round-2" } }),
  ]);

  const [submission1, submission2, scoreResults, adjustments] = await Promise.all([
    round1
      ? prisma.submission.findUnique({
          where: { teamId_roundId: { teamId, roundId: round1.id } },
          include: { roundOneDecision: { include: { primaryCustomer: true, secondaryCustomer: true } } },
        })
      : Promise.resolve(null),
    round2
      ? prisma.submission.findUnique({
          where: { teamId_roundId: { teamId, roundId: round2.id } },
          include: {
            roundTwoDecisions: { include: { customer: true, technicalSolution: true, commercialModel: true } },
          },
        })
      : Promise.resolve(null),
    prisma.scoreResult.findMany({
      where: { teamId },
      include: { breakdowns: true, round: true, scoringModelVersion: { select: { name: true, status: true } } },
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.manualScoreAdjustment.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      include: { round: true, createdByUser: { select: { loginIdentifier: true } } },
    }),
  ]);

  return { team, round1: { round: round1, submission: submission1 }, round2: { round: round2, submission: submission2 }, scoreResults, adjustments };
}
