// apps/api/src/modules/decisions/decisions.types.ts

import { JSONValue } from "postgres";

export const DECISION_STATUSES = [
  "draft",
  "proposed",
  "approved",
  "rejected",
  "superseded",
  "archived",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export type DecisionVersionPayload = {
  context: JSONValue;
  options: JSONValue;
  tradeoffs: JSONValue;
  assumptions: JSONValue;
  risks: JSONValue;
  outcome: JSONValue;
};

export type Decision = {
  id: string;
  orgId: string;
  title: string;
  status: DecisionStatus;

  createdBy: string;
  createdAt: Date;

  approvedBy: string | null;
  approvedAt: Date | null;
};

export type DecisionListItem = {
  id: string;
  title: string;
  status: DecisionStatus;
  createdAt: Date;
  approvedAt: Date | null;
};

export type DecisionVersion = {
  id: string;
  decisionId: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  payload: DecisionVersionPayload;
};

// Comment “raw” (DB style)
export type DecisionCommentRaw = {
  id: string;
  decisionId: string;
  createdBy: string;
  createdAt: Date;
  body: string;
};

// Comment “enriched” (API style)
export type DecisionComment = {
  id: string;
  decisionId: string;
  createdAt: Date;
  body: string;
  author?: {
    userId: string;
    displayName: string | null;
    role: string | null;
  };
  // fallback si pas encore enrichi:
  createdBy?: string;
};

export type DecisionsRepo = {
  listDecisions(orgId: string): Promise<DecisionListItem[]>;
  getDecision(decisionId: string, orgId: string): Promise<Decision | null>;
  getVersions(decisionId: string): Promise<DecisionVersion[]>;
  getComments(decisionId: string): Promise<DecisionComment[] | DecisionCommentRaw[]>;

  createDecision(input: {
    id: string;
    orgId: string;
    title: string;
    createdBy: string;
  }): Promise<void>;

  createVersion(input: {
    id: string;
    decisionId: string;
    version: number;
    createdBy: string;
    payload: DecisionVersionPayload;
  }): Promise<void>;

  nextVersionNumber(decisionId: string): Promise<number>;

  addComment(input: {
    id: string;
    decisionId: string;
    createdBy: string;
    body: string;
  }): Promise<void>;

  approveDecision(input: {
    decisionId: string;
    approvedBy: string;
    orgId: string;
  }): Promise<void>;

  /**
   * ✅ Change status from UI:
   * - default is draft on create
   * - after creation you can set: proposed/approved/rejected/superseded/archived
   */
  updateDecisionStatus(input: {
    decisionId: string;
    orgId: string;
    status: DecisionStatus;
    changedBy: string;
  }): Promise<void>;
};