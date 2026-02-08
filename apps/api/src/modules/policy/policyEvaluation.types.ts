export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue };

export type PolicyEvaluationInsertRow = {
  id: string;
  occurredAt: Date;
  userId: string | null;
  orgId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  allow: boolean;
  reason: string | null;
  rule: string | null;
  correlationId: string;
  input: JsonValue;
  result: JsonValue;
};

export type PolicyEvalRepo = {
  insert: (row: PolicyEvaluationInsertRow) => Promise<void>;
};
