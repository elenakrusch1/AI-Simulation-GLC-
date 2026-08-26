-- Prisma's schema language cannot express a partial unique index, so
-- this is a hand-written follow-up migration. It backstops the
-- application-layer rule (activating a ScoringModelVersion archives
-- any other ACTIVE version in the same transaction) with a real
-- database constraint: at most one row of ScoringModelVersion may
-- have status = 'ACTIVE' at any time.
CREATE UNIQUE INDEX "one_active_scoring_model_version"
  ON "ScoringModelVersion" ("status")
  WHERE "status" = 'ACTIVE';
