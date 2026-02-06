import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.string().default('info'),
  OPA_URL: z.string().default('http://localhost:8181'),
  DATABASE_URL: z
    .string()
    .default('postgresql://flowdesk:flowdesk@localhost:5432/flowdesk'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export const env = EnvSchema.parse(process.env);
