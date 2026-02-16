import type { Sql } from '../../db/client';
import type { Role } from './auth.types';

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string;
};

// Row "DB-shape" (snake_case) — doit matcher auth.routes.ts
export type RefreshRow = {
  id: string; // jti
  org_id: string | null;
  user_id: string;
  token_hash: string;
  expires_at: Date;

  revoked_at?: Date | null;
  replaced_by?: string | null;
  last_used_at?: Date | null;
};

export function buildAuthRepo(sql: Sql) {
  return {
    async findUserByEmail(email: string): Promise<DbUser | null> {
      const rows = await sql<DbUser[]>`
        select
          id,
          email,
          password_hash as "passwordHash",
          display_name as "displayName"
        from users
        where email = ${email}
        limit 1
      `;
      return rows[0] ?? null;
    },

    async createUser(u: DbUser): Promise<void> {
      await sql`
        insert into users (id, email, password_hash, display_name)
        values (${u.id}, ${u.email}, ${u.passwordHash}, ${u.displayName})
      `;
    },

    async createOrg(o: { id: string; name: string }): Promise<void> {
      await sql`
        insert into orgs (id, name)
        values (${o.id}, ${o.name})
      `;
    },

    async addMembership(m: {
      id: string;
      orgId: string;
      userId: string;
      role: Role;
    }): Promise<void> {
      await sql`
        insert into memberships (id, org_id, user_id, role)
        values (${m.id}, ${m.orgId}, ${m.userId}, ${m.role})
      `;
    },

    async getMembership(orgId: string, userId: string): Promise<Role | null> {
      const rows = await sql<{ role: Role }[]>`
        SELECT role
        FROM memberships
        WHERE org_id = ${orgId} AND user_id = ${userId}
        LIMIT  1
      `;
      return rows[0]?.role ?? null;
    },

    // auth.routes.ts appelle ça avec une RefreshRow snake_case
    async upsertRefreshToken(rt: RefreshRow): Promise<void> {
      await sql`
        insert into refresh_tokens (id, user_id, org_id, token_hash, expires_at)
        values (${rt.id}, ${rt.user_id}, ${rt.org_id}, ${rt.token_hash}, ${rt.expires_at})
        on conflict (id) do update set
          org_id     = excluded.org_id,
          user_id    = excluded.user_id,
          token_hash = excluded.token_hash,
          expires_at = excluded.expires_at
      `;
    },

    // IMPORTANT:
    // - on filtre revoked_at et expires_at
    // - on NE filtre PAS replaced_by, sinon tu perds l’erreur "already used" (rotation)
    async findValidRefreshToken(id: string): Promise<RefreshRow | null> {
      const rows = await sql<RefreshRow[]>`
        select
          id,
          org_id,
          user_id,
          token_hash,
          expires_at,
          revoked_at,
          replaced_by,
          last_used_at
        from refresh_tokens
        where id = ${id}
          and revoked_at is null
          and expires_at > now()
        limit 1
      `;
      return rows[0] ?? null;
    },

    async revokeRefreshToken(id: string): Promise<void> {
      await sql`
        update refresh_tokens
        set revoked_at = now()
        where id = ${id}
      `;
    },

    // auth.routes.ts calls rotateRefreshToken({ oldId, newId, userId, orgId, newTokenHash, newExpiresAt })
    async rotateRefreshToken(params: {
      oldId: string;
      newId: string;
      orgId: string;
      userId: string;
      newTokenHash: string;
      newExpiresAt: Date;
    }): Promise<void> {
      await sql.begin(async () => {
        // lock old row
        const rows = await sql<
          { revokedAt: Date | null; replacedBy: string | null }[]
        >`
          select
            revoked_at as "revokedAt",
            replaced_by as "replacedBy"
          from refresh_tokens
          where id = ${params.oldId}
          for update
        `;

        const row = rows[0];
        if (!row) throw new Error('REFRESH_NOT_FOUND');
        if (row.revokedAt) throw new Error('REFRESH_REVOKED');
        if (row.replacedBy) throw new Error('REFRESH_ALREADY_ROTATED');

        // mark old as used + link to new
        await sql`
          update refresh_tokens
          set
            replaced_by = ${params.newId},
            last_used_at = now()
          where id = ${params.oldId}
        `;

        // insert new token row
        await sql`
          insert into refresh_tokens (id, user_id, org_id, token_hash, expires_at)
          values (${params.newId},${params.userId},${params.orgId}, ${params.newTokenHash}, ${params.newExpiresAt})
        `;
      });
    },
  };
}
