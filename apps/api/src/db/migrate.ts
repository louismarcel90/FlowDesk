import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres, { type Sql } from 'postgres';

const apiDir = process.cwd();

function maskDbUrl(url: string) {
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}

export function createSql(): Sql {
  const url = (process.env.DATABASE_URL ?? '').trim();
  if (!url) throw new Error('DATABASE_URL missing. Put it in apps/api/.env');

  console.error('[migrate] DATABASE_URL =', maskDbUrl(url));

  // Force SSL OFF en local/dev (évite TLSWrap/ECONNRESET)
  const isProd = process.env.NODE_ENV === 'production';
  const forceNoSsl = !isProd || process.env.PGSSL === 'false';

  return postgres(url, {
    ssl: forceNoSsl ? false : 'require',
    max: 1,
    connect_timeout: 10,
    idle_timeout: 10,
    keep_alive: 60,
  });
}

type SqlClient = ReturnType<typeof createSql>;

function getMigrationsDir() {
  return join(apiDir, 'migrations');
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 5) {
  let lastErr;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastErr = e;
      const err = e as { code?: string };

      // ✅ bon test
      if (err?.code !== 'ECONNRESET') throw e;

      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }

  throw lastErr;
}

async function ensureMigrationsTable(db: SqlClient) {
  await db`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `;
}

async function alreadyApplied(db: SqlClient) {
  const rows = await db<{ filename: string }[]>`
    select filename from schema_migrations
  `;
  return new Set(rows.map((r) => r.filename));
}

export async function migrate() {
  const sql = createSql(); // ✅ création runtime ici

  try {
    await withRetry(() => ensureMigrationsTable(sql));

    const applied = await withRetry(() => alreadyApplied(sql));
    const dir = getMigrationsDir();

    const files = (await readdir(dir))
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      if (applied.has(file)) continue;

      const content = await readFile(join(dir, file), 'utf8');

      await withRetry(() =>
        sql.begin(async (tx) => {
          await tx.unsafe(content);

          // insert safe
          await tx.unsafe(
            'insert into schema_migrations (filename) values ($1) on conflict (filename) do nothing',
            [file],
          );
        }),
      );

      console.log(`[migrate] applied ${file}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (process.argv[1]?.includes('migrate')) {
  migrate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
