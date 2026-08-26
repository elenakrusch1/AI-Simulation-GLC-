import type { RoundStatus, SubmissionStatus } from "@prisma/client";

// Single source of truth for how round/submission statuses are
// worded and colored across the app — never "best", "winning",
// "recommended", or any other scoring/quality language, per the
// simulation-neutrality requirement.
export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  NOT_STARTED: "Not Started",
  OPEN: "Open",
  CLOSED: "Closed",
  LOCKED: "Locked",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  LOCKED: "Locked",
};

export type BadgeTone = "open" | "closed" | "locked" | "draft" | "submitted" | "neutral";

export const ROUND_STATUS_TONE: Record<RoundStatus, BadgeTone> = {
  NOT_STARTED: "neutral",
  OPEN: "open",
  CLOSED: "closed",
  LOCKED: "locked",
};

export const SUBMISSION_STATUS_TONE: Record<SubmissionStatus, BadgeTone> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  LOCKED: "locked",
};
