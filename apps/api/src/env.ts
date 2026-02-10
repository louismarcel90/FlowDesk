import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.string().default('info'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPA_URL: z.string().url(),

  APP_NAME: z.string().default('flowdesk-api'),
});

export const env: Env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
