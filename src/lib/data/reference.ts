import "server-only";
import { prisma } from "@/lib/prisma";

// These three models carry no scoring information themselves (scores
// live only in ScoringRule/ScoreResult/ScoreBreakdown, which are
// admin-only), so the same read helpers are safe for both team and
// admin code paths.

export async function listActiveCustomers() {
  return prisma.customer.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true, description: true },
  });
}

export async function listActiveTechnicalSolutions() {
  return prisma.technicalSolution.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true, description: true },
  });
}

export async function listActiveCommercialModels() {
  return prisma.commercialModel.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true, description: true },
  });
}
