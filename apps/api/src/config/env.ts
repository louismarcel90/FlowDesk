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
  JWT_ISSUER: z.string().default('flowdesk'),
  JWT_AUDIENCE: z.string().default('flowdesk-web'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(1209600),
});

export const env = EnvSchema.parse(process.env);
