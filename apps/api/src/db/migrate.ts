import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSql } from "./client";

async function ensureMigrationsTable(sql: ReturnType<typeof createSql>) {
  await sql`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `;
}

async function alreadyApplied(sql: ReturnType<typeof createSql>) {
  const rows = await sql<{ filename: string }[]>`
    select filename from schema_migrations
  `;
  return new Set(rows.map((r) => r.filename));
}

export async function migrate() {
  const sql = createSql();

  try {
    await ensureMigrationsTable(sql);
    const applied = await alreadyApplied(sql);

    // IMPORTANT:
    // - si tu lances ce script depuis apps/api, cwd = apps/api => ok
    // - sinon, adapte vers join(process.cwd(), "apps/api/migrations")
    const dir = join(process.cwd(), "migrations");

    const files = (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b)); // ordre alphabétique

    for (const file of files) {
      if (applied.has(file)) continue;

      const full = join(dir, file);
      const content = await readFile(full, "utf8");

      await sql.begin(async (tx) => {
        // exécute le SQL brut
        await tx.unsafe(content);

        // ✅ pas de tx`...` (sinon "expression is not callable")
        await tx.unsafe(
          "insert into schema_migrations (filename) values ($1) on conflict (filename) do nothing",
          [file]
        );
      });

      // eslint-disable-next-line no-console
      console.log(`[migrate] applied ${file}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

if (process.argv[1]?.includes("migrate.ts")) {
  migrate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
