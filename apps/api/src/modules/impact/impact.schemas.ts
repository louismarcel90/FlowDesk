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
  // description: z.string().min(1),
  unit: z.string().min(1),
  direction: z.enum(['up', 'down']),
  initiativeId: z.string().optional(),
});

export const CreateMetricSnapshotSchema = z.object({
  occurredAt: z.string().datetime(),
  value: z.number().min(0, 'Value must be >= 0'),
  source: z.string().superRefine((val, ctx) => {
    const allowed = ['manual', 'datalog', 'warehouse', 'jira'];

    if (!allowed.includes(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'invalid source',
      });
    }
  }),
});

export const LinkDecisionSchema = z.object({
  initiativeId: z.string().min(1),
});

export const LinkDecisionToMetricSchema = z.object({
  metricId: z.string().uuid(),
});
