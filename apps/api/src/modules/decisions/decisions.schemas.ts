import { z } from "zod";

export const DecisionStatus = z.enum(["draft", "approved", "deprecated"]);

const AnyRecord = z.record(z.string(), z.any());

export const DecisionVersionPayload = z.object({
  context: AnyRecord.default({}),
  options: z.array(AnyRecord).default([]),
  tradeoffs: z.array(AnyRecord).default([]),
  assumptions: z.array(AnyRecord).default([]),
  risks: z.array(AnyRecord).default([]),
  outcome: AnyRecord.default({}),
});

export const CreateDecisionSchema = z.object({
  title: z.string().min(3),
  initial: DecisionVersionPayload,
});

export const NewVersionSchema = z.object({
  payload: DecisionVersionPayload,
});

export const AddCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});
