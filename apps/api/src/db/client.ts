import postgres from 'postgres';
import { env } from '../config/env';

export type Sql = postgres.Sql;

export function createSql(): Sql {
  return postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
  });
}
