import type { Sql} from '../../db/client';
import type { Role } from './auth.types';

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string;
};


export type RefreshTokenRow = {
  id: string;
  userId: string;
  orgId: string | null;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  lastUsedAt: Date | null;
};

type BeginCb = Parameters<typeof sql.begin>[0];
type Tx = Parameters<BeginCb>[0];

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

    async getMembership(orgId: string, userId: string): Promise<Role | null> {
      const rows = await sql<{ role: Role }[]>`
        select role
        from org_members
        where org_id = ${orgId} and user_id = ${userId}
        limit 1
      `;
      return rows[0]?.role ?? null;
    },

    async upsertRefreshToken(params: {
      id: string;
      userId: string;
      orgId: string | null;
      tokenHash: string;
      expiresAt: Date;
    }): Promise<void> {
      await sql`
        insert into refresh_tokens (id, user_id, org_id, token_hash, expires_at)
        values (${params.id}, ${params.userId}, ${params.orgId}, ${params.tokenHash}, ${params.expiresAt})
        on conflict (id) do update set
          user_id = excluded.user_id,
          org_id = excluded.org_id,
          token_hash = excluded.token_hash,
          expires_at = excluded.expires_at
      `;
    },

    async findValidRefreshToken(id: string): Promise<RefreshTokenRow | null> {
      const rows = await sql<RefreshTokenRow[]>`
        select
          id,
          user_id as "userId",
          org_id as "orgId",
          token_hash as "tokenHash",
          expires_at as "expiresAt",
          revoked_at as "revokedAt",
          replaced_by as "replacedBy",
          last_used_at as "lastUsedAt"
        from refresh_tokens
        where id = ${id}
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

    async rotateRefreshToken(params: {
      oldId: string;
      newId: string;
      userId: string;
      orgId: string | null;
      newTokenHash: string;
      newExpiresAt: Date;
    }): Promise<void> {
      await sql.begin(async (tx : Tx) => {
        const rows = await tx<{ revokedAt: Date | null; replacedBy: string | null }[]>`
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
        await tx`
          update refresh_tokens
          set
            replaced_by = ${params.newId},
            last_used_at = now()
          where id = ${params.oldId}
        `;

        // insert new token row
        await tx`
          insert into refresh_tokens (id, user_id, org_id, token_hash, expires_at)
          values (${params.newId}, ${params.userId}, ${params.orgId}, ${params.newTokenHash}, ${params.newExpiresAt})
        `;
      });
    },
  };
}
