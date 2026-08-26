-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEAM', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('NOT_STARTED', 'OPEN', 'CLOSED', 'LOCKED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "CustomerRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "ScoringModelStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScoringRuleType" AS ENUM ('BASE', 'COMBINATION', 'BONUS', 'PENALTY', 'MANUAL_CATEGORY');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "loginIdentifier" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "editingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalSolution" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TechnicalSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialModel" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommercialModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundOneDecision" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "primaryCustomerId" UUID NOT NULL,
    "secondaryCustomerId" UUID NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundOneDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundTwoDecision" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "customerRole" "CustomerRole" NOT NULL,
    "technicalSolutionId" UUID NOT NULL,
    "commercialModelId" UUID NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundTwoDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringModelVersion" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ScoringModelStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ScoringModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringRule" (
    "id" UUID NOT NULL,
    "externalRuleId" TEXT,
    "scoringModelVersionId" UUID NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "customerId" UUID,
    "customerRole" "CustomerRole",
    "technicalSolutionId" UUID,
    "commercialModelId" UUID,
    "ruleType" "ScoringRuleType" NOT NULL,
    "points" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreResult" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "scoringModelVersionId" UUID NOT NULL,
    "calculatedScore" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreBreakdown" (
    "id" UUID NOT NULL,
    "scoreResultId" UUID NOT NULL,
    "scoringRuleId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "internalDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualScoreAdjustment" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "roundId" UUID,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardPublication" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "includedRounds" JSONB NOT NULL,
    "publishedByUserId" UUID NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" UUID NOT NULL,
    "publicationId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "publishedScore" INTEGER NOT NULL,
    "tied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginIdentifier_key" ON "User"("loginIdentifier");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Team_userId_key" ON "Team"("userId");

-- CreateIndex
CREATE INDEX "Team_active_idx" ON "Team"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Round_number_key" ON "Round"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Round_slug_key" ON "Round"("slug");

-- CreateIndex
CREATE INDEX "Round_status_idx" ON "Round"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "Customer_active_idx" ON "Customer"("active");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalSolution_code_key" ON "TechnicalSolution"("code");

-- CreateIndex
CREATE INDEX "TechnicalSolution_active_idx" ON "TechnicalSolution"("active");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialModel_code_key" ON "CommercialModel"("code");

-- CreateIndex
CREATE INDEX "CommercialModel_active_idx" ON "CommercialModel"("active");

-- CreateIndex
CREATE INDEX "Submission_roundId_status_idx" ON "Submission"("roundId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_teamId_roundId_key" ON "Submission"("teamId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundOneDecision_submissionId_key" ON "RoundOneDecision"("submissionId");

-- CreateIndex
CREATE INDEX "RoundOneDecision_primaryCustomerId_idx" ON "RoundOneDecision"("primaryCustomerId");

-- CreateIndex
CREATE INDEX "RoundOneDecision_secondaryCustomerId_idx" ON "RoundOneDecision"("secondaryCustomerId");

-- CreateIndex
CREATE INDEX "RoundTwoDecision_customerId_idx" ON "RoundTwoDecision"("customerId");

-- CreateIndex
CREATE INDEX "RoundTwoDecision_technicalSolutionId_idx" ON "RoundTwoDecision"("technicalSolutionId");

-- CreateIndex
CREATE INDEX "RoundTwoDecision_commercialModelId_idx" ON "RoundTwoDecision"("commercialModelId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundTwoDecision_submissionId_customerRole_key" ON "RoundTwoDecision"("submissionId", "customerRole");

-- CreateIndex
CREATE INDEX "ScoringModelVersion_status_idx" ON "ScoringModelVersion"("status");

-- CreateIndex
CREATE INDEX "ScoringRule_scoringModelVersionId_roundNumber_idx" ON "ScoringRule"("scoringModelVersionId", "roundNumber");

-- CreateIndex
CREATE INDEX "ScoringRule_customerId_idx" ON "ScoringRule"("customerId");

-- CreateIndex
CREATE INDEX "ScoreResult_roundId_idx" ON "ScoreResult"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreResult_teamId_roundId_scoringModelVersionId_key" ON "ScoreResult"("teamId", "roundId", "scoringModelVersionId");

-- CreateIndex
CREATE INDEX "ScoreBreakdown_scoreResultId_idx" ON "ScoreBreakdown"("scoreResultId");

-- CreateIndex
CREATE INDEX "ManualScoreAdjustment_teamId_roundId_idx" ON "ManualScoreAdjustment"("teamId", "roundId");

-- CreateIndex
CREATE INDEX "LeaderboardPublication_visible_idx" ON "LeaderboardPublication"("visible");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_publicationId_rank_idx" ON "LeaderboardEntry"("publicationId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_publicationId_teamId_key" ON "LeaderboardEntry"("publicationId", "teamId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundOneDecision" ADD CONSTRAINT "RoundOneDecision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundOneDecision" ADD CONSTRAINT "RoundOneDecision_primaryCustomerId_fkey" FOREIGN KEY ("primaryCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundOneDecision" ADD CONSTRAINT "RoundOneDecision_secondaryCustomerId_fkey" FOREIGN KEY ("secondaryCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTwoDecision" ADD CONSTRAINT "RoundTwoDecision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTwoDecision" ADD CONSTRAINT "RoundTwoDecision_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTwoDecision" ADD CONSTRAINT "RoundTwoDecision_technicalSolutionId_fkey" FOREIGN KEY ("technicalSolutionId") REFERENCES "TechnicalSolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTwoDecision" ADD CONSTRAINT "RoundTwoDecision_commercialModelId_fkey" FOREIGN KEY ("commercialModelId") REFERENCES "CommercialModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringModelVersion" ADD CONSTRAINT "ScoringModelVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringRule" ADD CONSTRAINT "ScoringRule_scoringModelVersionId_fkey" FOREIGN KEY ("scoringModelVersionId") REFERENCES "ScoringModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringRule" ADD CONSTRAINT "ScoringRule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringRule" ADD CONSTRAINT "ScoringRule_technicalSolutionId_fkey" FOREIGN KEY ("technicalSolutionId") REFERENCES "TechnicalSolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringRule" ADD CONSTRAINT "ScoringRule_commercialModelId_fkey" FOREIGN KEY ("commercialModelId") REFERENCES "CommercialModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_scoringModelVersionId_fkey" FOREIGN KEY ("scoringModelVersionId") REFERENCES "ScoringModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_scoreResultId_fkey" FOREIGN KEY ("scoreResultId") REFERENCES "ScoreResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_scoringRuleId_fkey" FOREIGN KEY ("scoringRuleId") REFERENCES "ScoringRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualScoreAdjustment" ADD CONSTRAINT "ManualScoreAdjustment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualScoreAdjustment" ADD CONSTRAINT "ManualScoreAdjustment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualScoreAdjustment" ADD CONSTRAINT "ManualScoreAdjustment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardPublication" ADD CONSTRAINT "LeaderboardPublication_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "LeaderboardPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
