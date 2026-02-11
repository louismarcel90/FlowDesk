import { z } from 'zod';

export const CreateInitiativeSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  status: z.enum(['planned', 'active', 'done']).default('planned')
});

export const CreateMetricSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  direction: z.enum(['up', 'down']),
  initiativeId: z.string().optional()
});

export const CreateMetricSnapshotSchema = z.object({
  occurredAt: z.string().datetime(),
  value: z.number(),
  source: z.enum(['manual', 'import']).default('manual')
});

export const LinkDecisionSchema = z.object({
  initiativeId: z.string().min(1)
});
