import "server-only";
import { prisma } from "@/lib/prisma";
import type { RoundStatus, SubmissionStatus } from "@prisma/client";

export interface TeamDashboardRound {
  slug: string;
  name: string;
  status: RoundStatus;
  editingAllowed: boolean;
  /** A round is "released" to the team once it has ever been opened. */
  released: boolean;
  submissionStatus: SubmissionStatus | null;
}

export interface TeamDashboardData {
  teamName: string;
  rounds: TeamDashboardRound[];
}

export async function getTeamDashboard(teamId: string): Promise<TeamDashboardData> {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true } });
  const rounds = await prisma.round.findMany({ orderBy: { number: "asc" } });
  const submissions = await prisma.submission.findMany({
    where: { teamId, roundId: { in: rounds.map((r) => r.id) } },
    select: { roundId: true, status: true },
  });

  return {
    teamName: team.name,
    rounds: rounds.map((round) => ({
      slug: round.slug,
      name: round.name,
      status: round.status,
      editingAllowed: round.editingAllowed,
      released: !!round.openedAt,
      submissionStatus: submissions.find((s) => s.roundId === round.id)?.status ?? null,
    })),
  };
}
