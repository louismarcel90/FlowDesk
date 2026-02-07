import type { Sql } from '../../db/client';
import type { Role } from './auth.types';

// Types
export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
};

export type RefreshTokenRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
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

    async createUser(user: { id: string; email: string; passwordHash: string; displayName: string }) {
      await sql`
        insert into users (id, email, password_hash, display_name)
        values (${user.id}, ${user.email}, ${user.passwordHash}, ${user.displayName})
      `;
    },

    async createOrg(org: { id: string; name: string }) {
      await sql`insert into orgs (id, name) values (${org.id}, ${org.name})`;
    },

    async addMembership(m: { id: string; orgId: string; userId: string; role: Role }) {
      await sql`
        insert into memberships (id, org_id, user_id, role)
        values (${m.id}, ${m.orgId}, ${m.userId}, ${m.role})
      `;
    },

    async getMembership(orgId: string, userId: string) {
      const rows = await sql<{ role: Role }[]>`
        select role
        from memberships
        where org_id = ${orgId} and user_id = ${userId}
        limit 1
      `;
      return rows[0]?.role ?? null;
    },

    async upsertRefreshToken(rt: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await sql`
    insert into refresh_tokens (id, user_id, token_hash, expires_at)
    values (${rt.id}, ${rt.userId}, ${rt.tokenHash}, ${rt.expiresAt})
    on conflict (id) do update set
      user_id = excluded.user_id,
      token_hash = excluded.token_hash,
      expires_at = excluded.expires_at
  `;
},

    async findValidRefreshToken(id: string): Promise<RefreshTokenRow | null> {
      const rows = await sql<RefreshTokenRow[]>`
        select
          id,
          user_id as "userId",
          token_hash as "tokenHash",
          expires_at as "expiresAt",
          revoked_at as "revokedAt"
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
  }
  };
}
