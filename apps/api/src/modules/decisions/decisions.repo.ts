// apps/api/src/modules/decisions/decisions.repo.ts

import type { Sql } from "../../db/client";

import {
  DecisionStatusSchema,
  DecisionVersionPayload as DecisionVersionPayloadSchema,
} from "./decisions.schemas";


import type {
  Decision,
  DecisionComment,
  // DecisionCommentRaw,
  DecisionListItem,
  DecisionsRepo,
  DecisionStatus,
  DecisionVersion,
  DecisionVersionPayload,
} from "./decisions.types";

type DbDecisionRow = {
  id: string;
  org_id: string;
  title: string;
  status: string;
  created_by: string;
  created_at: Date;
  approved_by: string | null;
  approved_at: Date | null;
};

type DbDecisionListRow = {
  id: string;
  title: string;
  status: string;
  created_at: Date;
  approved_at: Date | null;
};

type DbDecisionVersionRow = {
  id: string;
  decision_id: string;
  version: number;
  created_by: string;
  created_at: string; // dans ton fichier c’était string
  context: unknown;
  options: unknown;
  tradeoffs: unknown;
  assumptions: unknown;
  risks: unknown;
  outcome: unknown;
};

// type DbDecisionCommentRow = {
//   id: string;
//   decision_id: string;
//   created_by: string;
//   created_at: Date;
//   body: string;
// };

export function buildDecisionsRepo(sql: Sql): DecisionsRepo {
  return {
    async createDecision(input): Promise<void> {
      await sql`
        insert into decisions (id, org_id, title, status, created_by)
        values (${input.id}, ${input.orgId}, ${input.title}, 'draft', ${input.createdBy})
      `;
    },

    async createVersion(input: {
      id: string;
      decisionId: string;
      version: number;
      createdBy: string;
      payload: DecisionVersionPayload;
    }): Promise<void> {
      await sql`
        insert into decision_versions
          (id, decision_id, version, created_by, context, options, tradeoffs, assumptions, risks, outcome)
        values
          (${input.id}, ${input.decisionId}, ${input.version}, ${input.createdBy},
           ${sql.json(input.payload.context)},
           ${sql.json(input.payload.options)},
           ${sql.json(input.payload.tradeoffs)},
           ${sql.json(input.payload.assumptions)},
           ${sql.json(input.payload.risks)},
           ${sql.json(input.payload.outcome)})
      `;
    },

    async nextVersionNumber(decisionId: string): Promise<number> {
      const rows = await sql<{ max: number | null }[]>`
        select max(version) as max
        from decision_versions
        where decision_id = ${decisionId}
      `;
      return (rows[0]?.max ?? 0) + 1;
    },

    async listDecisions(orgId: string): Promise<DecisionListItem[]> {
      const rows = await sql<DbDecisionListRow[]>`
        select id, title, status, created_at, approved_at
        from decisions
        where org_id = ${orgId}
        order by created_at desc
        limit 100
      `;

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: DecisionStatusSchema.parse(r.status) as DecisionStatus,
        createdAt: r.created_at,
        approvedAt: r.approved_at,
      }));
    },

    async getDecision(decisionId: string, orgId: string): Promise<Decision | null> {
      const rows = await sql<DbDecisionRow[]>`
        select *
        from decisions
        where id = ${decisionId} and org_id = ${orgId}
        limit 1
      `;

      const r = rows[0];
      if (!r) return null;

      return {
        id: r.id,
        orgId: r.org_id,
        title: r.title,
        status: DecisionStatusSchema.parse(r.status) as DecisionStatus,
        createdBy: r.created_by,
        createdAt: r.created_at,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at,
      };
    },

    async getVersions(decisionId: string): Promise<DecisionVersion[]> {
      const rows = await sql<DbDecisionVersionRow[]>`
        select *
        from decision_versions
        where decision_id = ${decisionId}
        order by version desc
      `;

      return rows.map((r) => {
        const payload = DecisionVersionPayloadSchema.parse({
          context: r.context,
          options: r.options,
          tradeoffs: r.tradeoffs,
          assumptions: r.assumptions,
          risks: r.risks,
          outcome: r.outcome,
        }) as DecisionVersionPayload;

        return {
          id: r.id,
          decisionId: r.decision_id,
          version: r.version,
          createdBy: r.created_by,
          createdAt: new Date(r.created_at),
          payload,
        };
      });
    },

    async addComment(input): Promise<void> {
      await sql`
        insert into decision_comments (id, decision_id, created_by, body)
        values (${input.id}, ${input.decisionId}, ${input.createdBy}, ${input.body})
      `;
    },

    // async getComments(decisionId: string): Promise<(DecisionComment | DecisionCommentRaw)[]> {
    //   const rows = await sql<DbDecisionCommentRow[]>`
    //     select id, decision_id, created_by, created_at, body
    //     from decision_comments
    //     where decision_id = ${decisionId}
    //     order by created_at asc
    //   `;

    //   // Pas d’enrichissement pour l’instant → raw
    //   return rows.map((r) => ({
    //     id: r.id,
    //     decisionId: r.decision_id,
    //     createdBy: r.created_by,
    //     createdAt: r.created_at,
    //     body: r.body,
    //   }));
    // },

    async getComments(decisionId: string): Promise<DecisionComment[]> {
  const rows = await sql<{
    id: string;
    decision_id: string;
    created_at: Date;
    body: string;
    user_id: string;
    display_name: string | null;
    role: string | null;
  }[]>`
    select 
      c.id,
      c.decision_id,
      c.created_at,
      c.body,
      u.id as user_id,
      u.display_name,
      m.role
    from decision_comments c
    join users u on u.id = c.created_by
    left join memberships m 
      on m.user_id = u.id
    where c.decision_id = ${decisionId}
    order by c.created_at asc
  `;

  return rows.map((r) => ({
    id: r.id,
    decisionId: r.decision_id,
    createdAt: r.created_at,
    body: r.body,
    author: {
      userId: r.user_id,
      displayName: r.display_name,
      role: r.role,
    },
  }));
},

    async approveDecision(input): Promise<void> {
      await sql`
        update decisions
        set status = 'approved',
            approved_by = ${input.approvedBy},
            approved_at = now()
        where id = ${input.decisionId}
          and org_id = ${input.orgId}
          and status = 'draft'
      `;
    },

    async updateDecisionStatus(input): Promise<void> {
      // Si approved → set approved_by/approved_at
      if (input.status === "approved") {
        await sql`
          update decisions
          set status = ${input.status},
              approved_by = ${input.changedBy},
              approved_at = now()
          where id = ${input.decisionId}
            and org_id = ${input.orgId}
        `;
        return;
      }

      // Sinon: update status only (ne wipe pas approved fields)
      await sql`
        update decisions
        set status = ${input.status}
        where id = ${input.decisionId}
          and org_id = ${input.orgId}
      `;
    },
  };
}