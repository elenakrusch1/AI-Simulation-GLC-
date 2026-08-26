import "server-only";
import { prisma } from "@/lib/prisma";
import type { CustomerRole, Prisma, PrismaClient, RoundStatus, SubmissionStatus } from "@prisma/client";

/** Raised for any rule violation — callers turn this into a user-facing form error. */
export class SubmissionRuleError extends Error {}

interface RoundGate {
  id: string;
  status: RoundStatus;
  editingAllowed: boolean;
}

function assertRoundIsEditable(round: RoundGate, roundLabel: string): void {
  if (round.status !== "OPEN" || !round.editingAllowed) {
    throw new SubmissionRuleError(`${roundLabel} is not currently open for editing.`);
  }
}

async function assertCustomersActive(
  client: Pick<PrismaClient, "customer">,
  customerIds: string[],
): Promise<void> {
  const unique = Array.from(new Set(customerIds));
  const customers = await client.customer.findMany({ where: { id: { in: unique } } });
  if (customers.length !== unique.length || customers.some((c) => !c.active)) {
    throw new SubmissionRuleError("One or more selected customers is no longer available.");
  }
}

async function assertTechnicalSolutionsActive(
  client: Pick<PrismaClient, "technicalSolution">,
  ids: string[],
): Promise<void> {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return;
  const rows = await client.technicalSolution.findMany({ where: { id: { in: unique } } });
  if (rows.length !== unique.length || rows.some((r) => !r.active)) {
    throw new SubmissionRuleError("One or more selected technical solutions is no longer available.");
  }
}

async function assertCommercialModelsActive(
  client: Pick<PrismaClient, "commercialModel">,
  ids: string[],
): Promise<void> {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return;
  const rows = await client.commercialModel.findMany({ where: { id: { in: unique } } });
  if (rows.length !== unique.length || rows.some((r) => !r.active)) {
    throw new SubmissionRuleError("One or more selected commercial models is no longer available.");
  }
}

// ---------------------------------------------------------------------------
// Round 1 — read view
// ---------------------------------------------------------------------------

export interface TeamRoundOneView {
  round: (RoundGate & { name: string }) | null;
  submissionStatus: SubmissionStatus | null;
  submittedAt: Date | null;
  decision: {
    primaryCustomerId: string;
    primaryCustomerName: string;
    secondaryCustomerId: string;
    secondaryCustomerName: string;
    rationale: string | null;
  } | null;
}

export async function getTeamRoundOneView(teamId: string): Promise<TeamRoundOneView> {
  const round = await prisma.round.findUnique({ where: { slug: "round-1" } });
  if (!round) return { round: null, submissionStatus: null, submittedAt: null, decision: null };

  const submission = await prisma.submission.findUnique({
    where: { teamId_roundId: { teamId, roundId: round.id } },
    include: {
      roundOneDecision: {
        include: { primaryCustomer: true, secondaryCustomer: true },
      },
    },
  });

  const decision = submission?.roundOneDecision;

  return {
    round: { id: round.id, status: round.status, editingAllowed: round.editingAllowed, name: round.name },
    submissionStatus: submission?.status ?? null,
    submittedAt: submission?.submittedAt ?? null,
    decision: decision
      ? {
          primaryCustomerId: decision.primaryCustomerId,
          primaryCustomerName: decision.primaryCustomer.name,
          secondaryCustomerId: decision.secondaryCustomerId,
          secondaryCustomerName: decision.secondaryCustomer.name,
          rationale: decision.rationale,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Round 1 — writes (validated on entry, then re-validated inside the
// transaction against the latest committed state before writing).
// ---------------------------------------------------------------------------

interface RoundOneInput {
  primaryCustomerId?: string;
  secondaryCustomerId?: string;
  rationale?: string;
}

async function loadRoundOneOrThrow() {
  const round = await prisma.round.findUnique({ where: { slug: "round-1" } });
  if (!round) throw new SubmissionRuleError("Round 1 is not configured yet.");
  return round;
}

export async function saveRoundOneDraft(teamId: string, input: RoundOneInput) {
  const round = await loadRoundOneOrThrow();
  assertRoundIsEditable(round, "Round 1");

  const providedIds = [input.primaryCustomerId, input.secondaryCustomerId].filter(
    (v): v is string => !!v,
  );
  if (providedIds.length) await assertCustomersActive(prisma, providedIds);

  return prisma.$transaction(async (tx) => {
    const freshRound = await tx.round.findUniqueOrThrow({ where: { id: round.id } });
    assertRoundIsEditable(freshRound, "Round 1");

    const submission = await tx.submission.upsert({
      where: { teamId_roundId: { teamId, roundId: round.id } },
      update: {},
      create: { teamId, roundId: round.id, status: "DRAFT" },
    });
    if (submission.status !== "DRAFT") {
      throw new SubmissionRuleError("Your Round 1 decisions have already been submitted.");
    }

    if (input.primaryCustomerId && input.secondaryCustomerId) {
      if (providedIds.length) await assertCustomersActive(tx, providedIds);
      await tx.roundOneDecision.upsert({
        where: { submissionId: submission.id },
        update: {
          primaryCustomerId: input.primaryCustomerId,
          secondaryCustomerId: input.secondaryCustomerId,
          rationale: input.rationale ?? null,
        },
        create: {
          submissionId: submission.id,
          primaryCustomerId: input.primaryCustomerId,
          secondaryCustomerId: input.secondaryCustomerId,
          rationale: input.rationale ?? null,
        },
      });
    }

    return submission;
  });
}

export async function submitRoundOne(
  teamId: string,
  input: { primaryCustomerId: string; secondaryCustomerId: string; rationale?: string },
) {
  const round = await loadRoundOneOrThrow();
  assertRoundIsEditable(round, "Round 1");
  await assertCustomersActive(prisma, [input.primaryCustomerId, input.secondaryCustomerId]);

  return prisma.$transaction(async (tx) => {
    const freshRound = await tx.round.findUniqueOrThrow({ where: { id: round.id } });
    assertRoundIsEditable(freshRound, "Round 1");

    const submission = await tx.submission.upsert({
      where: { teamId_roundId: { teamId, roundId: round.id } },
      update: {},
      create: { teamId, roundId: round.id, status: "DRAFT" },
    });
    if (submission.status !== "DRAFT") {
      throw new SubmissionRuleError("Your Round 1 decisions have already been submitted.");
    }

    await assertCustomersActive(tx, [input.primaryCustomerId, input.secondaryCustomerId]);

    await tx.roundOneDecision.upsert({
      where: { submissionId: submission.id },
      update: {
        primaryCustomerId: input.primaryCustomerId,
        secondaryCustomerId: input.secondaryCustomerId,
        rationale: input.rationale ?? null,
      },
      create: {
        submissionId: submission.id,
        primaryCustomerId: input.primaryCustomerId,
        secondaryCustomerId: input.secondaryCustomerId,
        rationale: input.rationale ?? null,
      },
    });

    return tx.submission.update({
      where: { id: submission.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });
}

// ---------------------------------------------------------------------------
// Round 2 — read view
// ---------------------------------------------------------------------------

export interface RoundOneCustomerAssignment {
  role: CustomerRole;
  customerId: string;
  customerName: string;
}

export interface RoundTwoDecisionView {
  customerRole: CustomerRole;
  customerId: string;
  customerName: string;
  technicalSolutionId: string;
  technicalSolutionName: string;
  commercialModelId: string;
  commercialModelName: string;
  rationale: string | null;
}

export interface TeamRoundTwoView {
  round: (RoundGate & { name: string }) | null;
  /** True only when Round 1 has a final SUBMITTED decision for this team. */
  roundOneFinalized: boolean;
  roundOneCustomers: RoundOneCustomerAssignment[] | null;
  submissionStatus: SubmissionStatus | null;
  submittedAt: Date | null;
  decisions: RoundTwoDecisionView[];
}

async function getFinalizedRoundOneDecision(teamId: string) {
  const round1 = await prisma.round.findUnique({ where: { slug: "round-1" } });
  if (!round1) return null;

  const submission = await prisma.submission.findUnique({
    where: { teamId_roundId: { teamId, roundId: round1.id } },
    include: {
      roundOneDecision: { include: { primaryCustomer: true, secondaryCustomer: true } },
    },
  });

  if (!submission || submission.status !== "SUBMITTED" || !submission.roundOneDecision) return null;
  return submission.roundOneDecision;
}

export async function getTeamRoundTwoView(teamId: string): Promise<TeamRoundTwoView> {
  const finalRoundOne = await getFinalizedRoundOneDecision(teamId);
  const roundOneFinalized = !!finalRoundOne;
  const roundOneCustomers: RoundOneCustomerAssignment[] | null = finalRoundOne
    ? [
        { role: "PRIMARY", customerId: finalRoundOne.primaryCustomerId, customerName: finalRoundOne.primaryCustomer.name },
        { role: "SECONDARY", customerId: finalRoundOne.secondaryCustomerId, customerName: finalRoundOne.secondaryCustomer.name },
      ]
    : null;

  const round = await prisma.round.findUnique({ where: { slug: "round-2" } });
  if (!round) {
    return {
      round: null,
      roundOneFinalized,
      roundOneCustomers,
      submissionStatus: null,
      submittedAt: null,
      decisions: [],
    };
  }

  const submission = await prisma.submission.findUnique({
    where: { teamId_roundId: { teamId, roundId: round.id } },
    include: {
      roundTwoDecisions: {
        include: { customer: true, technicalSolution: true, commercialModel: true },
      },
    },
  });

  return {
    round: { id: round.id, status: round.status, editingAllowed: round.editingAllowed, name: round.name },
    roundOneFinalized,
    roundOneCustomers,
    submissionStatus: submission?.status ?? null,
    submittedAt: submission?.submittedAt ?? null,
    decisions: (submission?.roundTwoDecisions ?? []).map((d) => ({
      customerRole: d.customerRole,
      customerId: d.customerId,
      customerName: d.customer.name,
      technicalSolutionId: d.technicalSolutionId,
      technicalSolutionName: d.technicalSolution.name,
      commercialModelId: d.commercialModelId,
      commercialModelName: d.commercialModel.name,
      rationale: d.rationale,
    })),
  };
}

// ---------------------------------------------------------------------------
// Round 2 — writes
// ---------------------------------------------------------------------------

interface RoundTwoSideInput {
  role: CustomerRole;
  customerId: string;
  technicalSolutionId?: string;
  commercialModelId?: string;
  rationale?: string;
}

interface RoundTwoInput {
  primary: RoundTwoSideInput;
  secondary: RoundTwoSideInput;
}

async function loadRoundTwoOrThrow() {
  const round = await prisma.round.findUnique({ where: { slug: "round-2" } });
  if (!round) throw new SubmissionRuleError("Round 2 is not configured yet.");
  return round;
}

/** Throws unless Round 1 is finally submitted and the given customer IDs/roles exactly match it. */
async function assertMatchesFinalizedRoundOne(teamId: string, input: RoundTwoInput): Promise<void> {
  const decision = await getFinalizedRoundOneDecision(teamId);
  if (!decision) {
    throw new SubmissionRuleError(
      "Round 2 is unavailable until your Round 1 decisions have been finally submitted.",
    );
  }
  if (input.primary.customerId !== decision.primaryCustomerId) {
    throw new SubmissionRuleError("The primary customer no longer matches your Round 1 submission.");
  }
  if (input.secondary.customerId !== decision.secondaryCustomerId) {
    throw new SubmissionRuleError("The secondary customer no longer matches your Round 1 submission.");
  }
}

async function upsertRoundTwoDecision(
  tx: Prisma.TransactionClient,
  submissionId: string,
  side: RoundTwoSideInput,
): Promise<void> {
  if (!side.technicalSolutionId || !side.commercialModelId) return;
  await tx.roundTwoDecision.upsert({
    where: { submissionId_customerRole: { submissionId, customerRole: side.role } },
    update: {
      customerId: side.customerId,
      technicalSolutionId: side.technicalSolutionId,
      commercialModelId: side.commercialModelId,
      rationale: side.rationale ?? null,
    },
    create: {
      submissionId,
      customerId: side.customerId,
      customerRole: side.role,
      technicalSolutionId: side.technicalSolutionId,
      commercialModelId: side.commercialModelId,
      rationale: side.rationale ?? null,
    },
  });
}

export async function saveRoundTwoDraft(teamId: string, input: RoundTwoInput) {
  const round = await loadRoundTwoOrThrow();
  assertRoundIsEditable(round, "Round 2");
  await assertMatchesFinalizedRoundOne(teamId, input);

  const techIds = [input.primary.technicalSolutionId, input.secondary.technicalSolutionId].filter(
    (v): v is string => !!v,
  );
  const modelIds = [input.primary.commercialModelId, input.secondary.commercialModelId].filter(
    (v): v is string => !!v,
  );
  await assertTechnicalSolutionsActive(prisma, techIds);
  await assertCommercialModelsActive(prisma, modelIds);

  return prisma.$transaction(async (tx) => {
    const freshRound = await tx.round.findUniqueOrThrow({ where: { id: round.id } });
    assertRoundIsEditable(freshRound, "Round 2");

    const submission = await tx.submission.upsert({
      where: { teamId_roundId: { teamId, roundId: round.id } },
      update: {},
      create: { teamId, roundId: round.id, status: "DRAFT" },
    });
    if (submission.status !== "DRAFT") {
      throw new SubmissionRuleError("Your Round 2 decisions have already been submitted.");
    }

    await assertTechnicalSolutionsActive(tx, techIds);
    await assertCommercialModelsActive(tx, modelIds);

    await upsertRoundTwoDecision(tx, submission.id, input.primary);
    await upsertRoundTwoDecision(tx, submission.id, input.secondary);

    return submission;
  });
}

export async function submitRoundTwo(teamId: string, input: RoundTwoInput) {
  const round = await loadRoundTwoOrThrow();
  assertRoundIsEditable(round, "Round 2");
  await assertMatchesFinalizedRoundOne(teamId, input);

  const techIds = [input.primary.technicalSolutionId, input.secondary.technicalSolutionId].filter(
    (v): v is string => !!v,
  );
  const modelIds = [input.primary.commercialModelId, input.secondary.commercialModelId].filter(
    (v): v is string => !!v,
  );
  if (techIds.length !== 2 || modelIds.length !== 2) {
    throw new SubmissionRuleError("A technical solution and commercial model are required for both customers.");
  }
  await assertTechnicalSolutionsActive(prisma, techIds);
  await assertCommercialModelsActive(prisma, modelIds);

  return prisma.$transaction(async (tx) => {
    const freshRound = await tx.round.findUniqueOrThrow({ where: { id: round.id } });
    assertRoundIsEditable(freshRound, "Round 2");

    const submission = await tx.submission.upsert({
      where: { teamId_roundId: { teamId, roundId: round.id } },
      update: {},
      create: { teamId, roundId: round.id, status: "DRAFT" },
    });
    if (submission.status !== "DRAFT") {
      throw new SubmissionRuleError("Your Round 2 decisions have already been submitted.");
    }

    await assertTechnicalSolutionsActive(tx, techIds);
    await assertCommercialModelsActive(tx, modelIds);

    await upsertRoundTwoDecision(tx, submission.id, input.primary);
    await upsertRoundTwoDecision(tx, submission.id, input.secondary);

    return tx.submission.update({
      where: { id: submission.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });
}
