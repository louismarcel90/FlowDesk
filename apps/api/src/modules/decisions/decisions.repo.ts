import type { Sql } from '../../db/client';
import {
  DecisionStatus as DecisionStatusSchema,
  DecisionVersionPayload as DecisionVersionPayloadSchema,
} from './decisions.schemas';
import type {
  DecisionStatus,
  DecisionVersionPayload,
} from './decisions.schemas';

export type Decision = {
  id: string;
  orgId: string;
  title: string;
  status: DecisionStatus;
  createdBy: string;
  createdAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
};

export type DecisionListItem = {
  id: string;
  title: string;
  status: DecisionStatus;
  createdAt: Date;
  approvedAt: Date | null;
};

export type DecisionVersion = {
  id: string;
  decisionId: string;
  version: number;
  createdBy: string;
  payload: DecisionVersionPayload;
};

export type DecisionComment = {
  id: string;
  decisionId: string;
  createdBy: string;
  createdAt: Date;
  body: string;
};

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
  created_at: string;
  context: unknown;
  options: unknown;
  tradeoffs: unknown;
  assumptions: unknown;
  risks: unknown;
  outcome: unknown;
};

type DbDecisionCommentRow = {
  id: string;
  decision_id: string;
  created_by: string;
  created_at: Date;
  body: string;
};

export function buildDecisionsRepo(sql: Sql) {
  return {
    async createDecision(params: {
      id: string;
      orgId: string;
      title: string;
      createdBy: string;
    }): Promise<void> {
      await sql`
        insert into decisions (id, org_id, title, status, created_by)
        values (${params.id}, ${params.orgId}, ${params.title}, 'draft', ${params.createdBy})
      `;
    },

    async createVersion(params: {
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
          (${params.id}, ${params.decisionId}, ${params.version}, ${params.createdBy},
           ${sql.json(params.payload.context)},
           ${sql.json(params.payload.options)},
           ${sql.json(params.payload.tradeoffs)},
           ${sql.json(params.payload.assumptions)},
           ${sql.json(params.payload.risks)},
           ${sql.json(params.payload.outcome)})
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
        status: DecisionStatusSchema.parse(r.status),
        createdAt: r.created_at.toISOString() as unknown as Date,
        approvedAt: r.approved_at
          ? (r.approved_at.toISOString() as unknown as Date)
          : null,
      }));
    },

    async getDecision(
      decisionId: string,
      orgId: string,
    ): Promise<Decision | null> {
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
        status: DecisionStatusSchema.parse(r.status),
        createdBy: r.created_by,
        createdAt: r.created_at.toISOString() as unknown as Date,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at
          ? (r.approved_at.toISOString() as unknown as Date)
          : null,
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
        });

        return {
          id: r.id,
          decisionId: r.decision_id,
          version: r.version,
          createdBy: r.created_by,
          createdAt: new Date(r.created_at).toISOString() as unknown as Date,
          payload,
        };
      });
    },

    async addComment(params: {
      id: string;
      decisionId: string;
      createdBy: string;
      body: string;
    }): Promise<void> {
      await sql`
        insert into decision_comments (id, decision_id, created_by, body)
        values (${params.id}, ${params.decisionId}, ${params.createdBy}, ${params.body})
      `;
    },

    async getComments(decisionId: string): Promise<DecisionComment[]> {
      const rows = await sql<DbDecisionCommentRow[]>`
        select id, decision_id, created_by, created_at, body
        from decision_comments
        where decision_id = ${decisionId}
        order by created_at asc
      `;

      return rows.map((r) => ({
        id: r.id,
        decisionId: r.decision_id,
        createdBy: r.created_by,
        createdAt: r.created_at.toISOString() as unknown as Date,
        body: r.body,
      }));
    },

    async approveDecision(params: {
      decisionId: string;
      approvedBy: string;
      orgId: string;
    }): Promise<void> {
      await sql`
        update decisions
        set status = 'approved',
            approved_by = ${params.approvedBy},
            approved_at = now()
        where id = ${params.decisionId}
          and org_id = ${params.orgId}
          and status = 'draft'
      `;
    },
  };
}
