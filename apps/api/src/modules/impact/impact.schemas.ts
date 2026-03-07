import { z } from 'zod';

export const InitiativeStatusSchema = z.enum(['planned', 'active', 'done']);

export const CreateInitiativeSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  status: InitiativeStatusSchema.default('planned'),
  decisionId: z.string().optional(),
});

export const UpdateInitiativeStatusSchema = z.object({
  status: InitiativeStatusSchema,
});

export const CreateMetricSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  direction: z.enum(['up', 'down']),
  initiativeId: z.string().optional(),
});

export const CreateMetricSnapshotSchema = z.object({
  occurredAt: z.string().datetime(),
  value: z.number(),
  source: z.enum(['manual', 'import']).default('manual'),
});

export const LinkDecisionSchema = z.object({
  initiativeId: z.string().min(1),
});
