import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, ScoringRuleType, CustomerRole } from "@prisma/client";
import { roundOneRuleMatches, roundTwoRuleMatches, describeRule } from "@/lib/scoring-rules";

// Rule-matching semantics live in src/lib/scoring-rules.ts (pure,
// unit-tested) — no points are ever invented here; the app ships with
// zero active rules and every point value is admin-entered.
// ruleType MANUAL_CATEGORY rules are NEVER auto-matched (filtered out
// below, before matching runs) — they exist only as a labeled
// reference an admin can use as the "reason" for a
// ManualScoreAdjustment.

export class ScoringRuleError extends Error {}

export async function listScoringModelVersions() {
  return prisma.scoringModelVersion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdByUser: { select: { loginIdentifier: true } },
      _count: { select: { rules: true } },
    },
  });
}

export async function getScoringModelVersionDetail(id: string) {
  return prisma.scoringModelVersion.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { loginIdentifier: true } },
      rules: {
        orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }],
        include: { customer: true, technicalSolution: true, commercialModel: true },
      },
    },
  });
}

export async function createScoringModelVersion(name: string, createdByUserId: string) {
  return prisma.scoringModelVersion.create({ data: { name, createdByUserId } });
}

interface CreateRuleInput {
  scoringModelVersionId: string;
  roundNumber: number;
  ruleType: ScoringRuleType;
  points: number;
  customerId?: string;
  customerRole?: CustomerRole;
  technicalSolutionId?: string;
  commercialModelId?: string;
  externalRuleId?: string;
  adminNote?: string;
}

export async function createScoringRule(input: CreateRuleInput) {
  const version = await prisma.scoringModelVersion.findUniqueOrThrow({
    where: { id: input.scoringModelVersionId },
  });
  if (version.status !== "DRAFT") {
    throw new ScoringRuleError("Rules can only be added while a scoring model version is in DRAFT.");
  }
  if (input.roundNumber === 1 && (input.technicalSolutionId || input.commercialModelId)) {
    throw new ScoringRuleError("Round 1 rules cannot reference a technical solution or commercial model.");
  }
  return prisma.scoringRule.create({ data: input });
}

export async function setScoringRuleActive(ruleId: string, active: boolean) {
  const rule = await prisma.scoringRule.findUniqueOrThrow({
    where: { id: ruleId },
    include: { scoringModelVersion: true },
  });
  if (rule.scoringModelVersion.status !== "DRAFT") {
    throw new ScoringRuleError("Rules can only be changed while the scoring model version is in DRAFT.");
  }
  return prisma.scoringRule.update({ where: { id: ruleId }, data: { active } });
}

/** DRAFT -> ACTIVE. Archives whatever version was previously ACTIVE, if any. */
export async function activateScoringModelVersion(id: string) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.scoringModelVersion.findUniqueOrThrow({ where: { id } });
    if (version.status !== "DRAFT") {
      throw new ScoringRuleError("Only a DRAFT scoring model version can be activated.");
    }
    await tx.scoringModelVersion.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    return tx.scoringModelVersion.update({
      where: { id },
      data: { status: "ACTIVE", activatedAt: new Date() },
    });
  });
}

/** ACTIVE -> ARCHIVED. */
export async function archiveScoringModelVersion(id: string) {
  const version = await prisma.scoringModelVersion.findUniqueOrThrow({ where: { id } });
  if (version.status !== "ACTIVE") {
    throw new ScoringRuleError("Only an ACTIVE scoring model version can be archived.");
  }
  return prisma.scoringModelVersion.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Calculation
// ---------------------------------------------------------------------------

type RuleWithNames = Prisma.ScoringRuleGetPayload<{
  include: { customer: true; technicalSolution: true; commercialModel: true };
}>;

interface ScoreComputation {
  teamId: string;
  roundId: string;
  calculatedScore: number;
  breakdown: { scoringRuleId: string; points: number; internalDescription: string }[];
}

async function computeRoundOneScores(rules: RuleWithNames[]): Promise<ScoreComputation[]> {
  const round = await prisma.round.findUnique({ where: { slug: "round-1" } });
  if (!round) return [];
  const round1Rules = rules.filter((r) => r.roundNumber === 1);

  const submissions = await prisma.submission.findMany({
    where: { roundId: round.id, status: "SUBMITTED" },
    include: { roundOneDecision: true },
  });

  return submissions
    .filter((s) => s.roundOneDecision)
    .map((s) => {
      const decision = s.roundOneDecision!;
      const breakdown: ScoreComputation["breakdown"] = [];
      let total = 0;
      for (const rule of round1Rules) {
        if (roundOneRuleMatches(rule, decision)) {
          total += rule.points;
          breakdown.push({ scoringRuleId: rule.id, points: rule.points, internalDescription: describeRule(rule) });
        }
      }
      return { teamId: s.teamId, roundId: round.id, calculatedScore: total, breakdown };
    });
}

async function computeRoundTwoScores(rules: RuleWithNames[]): Promise<ScoreComputation[]> {
  const round = await prisma.round.findUnique({ where: { slug: "round-2" } });
  if (!round) return [];
  const round2Rules = rules.filter((r) => r.roundNumber === 2);

  const submissions = await prisma.submission.findMany({
    where: { roundId: round.id, status: "SUBMITTED" },
    include: { roundTwoDecisions: true },
  });

  return submissions.map((s) => {
    const breakdown: ScoreComputation["breakdown"] = [];
    let total = 0;
    for (const row of s.roundTwoDecisions) {
      for (const rule of round2Rules) {
        if (!roundTwoRuleMatches(rule, row)) continue;
        total += rule.points;
        breakdown.push({ scoringRuleId: rule.id, points: rule.points, internalDescription: describeRule(rule) });
      }
    }
    return { teamId: s.teamId, roundId: round.id, calculatedScore: total, breakdown };
  });
}

export async function recalculateRoundScores(roundSlug: "round-1" | "round-2"): Promise<number> {
  const activeModel = await prisma.scoringModelVersion.findFirst({ where: { status: "ACTIVE" } });
  if (!activeModel) {
    throw new ScoringRuleError("No scoring model is active. Activate a scoring model version first.");
  }

  const rules = await prisma.scoringRule.findMany({
    where: { scoringModelVersionId: activeModel.id, active: true, ruleType: { not: "MANUAL_CATEGORY" } },
    include: { customer: true, technicalSolution: true, commercialModel: true },
  });

  const computations =
    roundSlug === "round-1" ? await computeRoundOneScores(rules) : await computeRoundTwoScores(rules);

  await prisma.$transaction(async (tx) => {
    for (const comp of computations) {
      const result = await tx.scoreResult.upsert({
        where: {
          teamId_roundId_scoringModelVersionId: {
            teamId: comp.teamId,
            roundId: comp.roundId,
            scoringModelVersionId: activeModel.id,
          },
        },
        update: { calculatedScore: comp.calculatedScore, calculatedAt: new Date() },
        create: {
          teamId: comp.teamId,
          roundId: comp.roundId,
          scoringModelVersionId: activeModel.id,
          calculatedScore: comp.calculatedScore,
        },
      });
      await tx.scoreBreakdown.deleteMany({ where: { scoreResultId: result.id } });
      if (comp.breakdown.length) {
        await tx.scoreBreakdown.createMany({
          data: comp.breakdown.map((b) => ({
            scoreResultId: result.id,
            scoringRuleId: b.scoringRuleId,
            points: b.points,
            internalDescription: b.internalDescription,
          })),
        });
      }
    }
  });

  return computations.length;
}
