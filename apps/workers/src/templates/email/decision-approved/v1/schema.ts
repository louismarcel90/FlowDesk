import { z } from 'zod';

export const DecisionApprovedTemplateV1 = z.object({
  decisionId: z.string(),
  decisionTitle: z.string(),
  orgId: z.string()
});

export type DecisionApprovedTemplateV1Input = z.infer<typeof DecisionApprovedTemplateV1>;
