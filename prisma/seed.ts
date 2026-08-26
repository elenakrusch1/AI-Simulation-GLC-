/**
 * Seeds reference data only: rounds (both NOT_STARTED — an admin
 * opens them later), customers, technical solutions, and commercial
 * models. Deliberately seeds ZERO scoring rules and creates no
 * ScoringModelVersion — the brief requires the app to ship with no
 * active/invented scoring values; admins define those from
 * /admin/scoring.
 *
 * Safe to re-run: every row is upserted by its natural unique key.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROUNDS = [
  { number: 1, slug: "round-1", name: "Customer Selection" },
  { number: 2, slug: "round-2", name: "Offer Design" },
] as const;

const CUSTOMERS = [
  { code: "A", name: "NorthGrid AI Campus" },
  { code: "B", name: "EuroColo Grid Platform" },
  { code: "C", name: "LegacyCompute DC Operator" },
  { code: "D", name: "FerroCloud Industries" },
  { code: "E", name: "NordicTrust Sovereign Cloud" },
] as const;

const TECHNICAL_SOLUTIONS = [
  { code: "TECH-1", name: "Efficient Core Infrastructure" },
  { code: "TECH-2", name: "Integrated Decarbonisation" },
  { code: "TECH-3", name: "Flexibility and Grid Solution" },
  { code: "TECH-4", name: "Net-Zero Energy Campus" },
] as const;

const COMMERCIAL_MODELS = [
  { code: "COM-1", name: "Customer-Funded CAPEX" },
  { code: "COM-2", name: "Energy-as-a-Service" },
  { code: "COM-3", name: "Shared Investment" },
  { code: "COM-4", name: "Performance-Linked Model" },
] as const;

async function main() {
  for (const [index, round] of ROUNDS.entries()) {
    await prisma.round.upsert({
      where: { slug: round.slug },
      update: { number: round.number, name: round.name },
      create: { ...round, status: "NOT_STARTED", editingAllowed: false },
    });
    void index;
  }

  for (const [index, customer] of CUSTOMERS.entries()) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: { name: customer.name, sortOrder: index },
      create: { ...customer, sortOrder: index },
    });
  }

  for (const [index, solution] of TECHNICAL_SOLUTIONS.entries()) {
    await prisma.technicalSolution.upsert({
      where: { code: solution.code },
      update: { name: solution.name, sortOrder: index },
      create: { ...solution, sortOrder: index },
    });
  }

  for (const [index, model] of COMMERCIAL_MODELS.entries()) {
    await prisma.commercialModel.upsert({
      where: { code: model.code },
      update: { name: model.name, sortOrder: index },
      create: { ...model, sortOrder: index },
    });
  }

  console.log("Seed complete: rounds, customers, technical solutions, commercial models.");
  console.log("No scoring rules were seeded — configure scoring from /admin/scoring.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
