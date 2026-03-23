import { AppError } from '../../core/errors';
import type { Sql } from '../../db/client';

export type InitiativeStatus = 'planned' | 'active' | 'done';

export type Initiative = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: InitiativeStatus;
  createdBy: string;
  createdAt: string;
  decisions?: {
    id: string;
    decisionId: string;
    decisionTitle: string;
    createdAt: string;
  }[];
};

type DbInitiativeRow = {
  id: string;
  org_id: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
};

type DbMetricRow = {
  id: string;
  initiativeId: string;
  name: string;
  unit: string;
  direction: string;
  // description: string | null;
  createdAt: string;
  createdBy: string;
};

type DbMetricDetailRow = {
  id: string;
  name: string;
  // description: string | null;
  unit: string;
  direction: string;
  createdAt: string;
};

type DbMetricSnapshotRow = {
  id: string;
  occurredAt: string;
  value: number;
  source: string;
  createdAt: string;
};

export type MetricListItem = {
  id: string;
  initiativeId: string;
  name: string;
  unit: string;
  direction: string;
  createdAt: string;
};

export type MetricSnapshot = {
  id: string;
  occurredAt: string;
  value: number;
  source: string;
  createdAt: string;
};

export type MetricDecisionLinkItem = {
  id: string;
  decisionId: string;
  decisionTitle: string;
  decisionStatus: string;
  createdAt: string;
};

type DbDecisionLinkRow = {
  id: string;
  initiative_id: string;
  initiative_name: string;
  createdAt: string;
};

type DbDecisionListRow = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export type DecisionLinkItem = {
  id: string;
  initiativeId: string;
  initiativeName: string;
  createdAt: string;
};

export type DecisionMetricLinkItem = {
  id: string;
  metricId: string;
  metricName: string;
  metricUnit: string;
  metricDirection: string;
  linkedAt: string;
  latestSnapshot: {
    id: string;
    value: number;
    occurredAt: string;
    source: string;
    createdAt: string;
  } | null;
};

export type DecisionListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

function toIsoOrNull(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const d =
    v instanceof Date
      ? v
      : typeof v === 'number'
        ? new Date(v)
        : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function buildImpactRepo(sql: Sql) {
  return {
    async createInitiative(p: {
      id: string;
      orgId: string;
      name: string;
      description: string;
      status: string;
      createdBy: string;
    }) {
      await sql`
        insert into initiatives (id, org_id, name, description, status, created_by)
        values (${p.id}, ${p.orgId}, ${p.name}, ${p.description}, ${p.status}, ${p.createdBy})
      `;
    },

    async listInitiatives(orgId: string): Promise<Initiative[]> {
      const rows = await sql<DbInitiativeRow[]>`
      select 
        id, 
        org_id, 
        name, 
        description, 
        status, 
        created_by as "createdBy", 
        created_at  as "createdAt"
      from initiatives
      where org_id = ${orgId}
      order by created_at DESC NULLS LAST
      limit 100
    `;

      return rows.map(
        (r): Initiative => ({
          id: r.id,
          orgId: r.org_id,
          name: r.name,
          description: r.description ?? null,
          status: r.status as InitiativeStatus,
          createdBy: r.createdBy ?? null,
          createdAt: toIsoOrNull(r.createdAt) ?? '',
        }),
      );
    },

    async getInitiative(orgId: string, id: string): Promise<Initiative | null> {
      const rows = await sql<DbInitiativeRow[]>`
    select id, org_id, name, description, status, created_at
    from initiatives
    where org_id = ${orgId} and id = ${id}
    limit 1
  `;

      const r = rows[0];
      if (!r) return null;

      const decisions = await this.listLinksForInitiative(r.id);

      return {
        id: r.id,
        orgId: r.org_id,
        name: r.name,
        description: r.description,
        status: r.status as InitiativeStatus,
        createdBy: r.createdBy,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
        decisions,
      };
    },

    async updateInitiativeStatus(p: {
      id: string;
      orgId: string;
      status: 'planned' | 'active' | 'done';
    }) {
      await sql`
    update initiatives
    set status = ${p.status}
    where id = ${p.id}
      and org_id = ${p.orgId}
  `;
    },

    async createMetric(p: {
      id: string;
      orgId: string;
      initiativeId?: string;
      name: string;
      unit: string;
      direction: string;
      createdBy: string;
    }) {
      await sql`
        insert into metrics (id, org_id, initiative_id, name, unit, direction, created_by)
        values (${p.id}, ${p.orgId}, ${p.initiativeId ?? null}, ${p.name}, ${p.unit}, ${p.direction}, ${p.createdBy})
      `;
    },

    async listMetrics(
      orgId: string,
      opts?: { initiativeId?: string },
    ): Promise<MetricListItem[]> {
      const rows = await sql<DbMetricRow[]>`
    select id, initiative_id as "initiativeId", name, unit, direction, created_at as "createdAt", created_by as "createdBy"
    from metrics
    where org_id = ${orgId}
    ${opts?.initiativeId ? sql`and initiative_id = ${opts.initiativeId}` : sql``}
    order by created_at desc
    limit 200
  `;

      return rows.map((r) => ({
        id: r.id,
        initiativeId: r.initiativeId,
        name: r.name,
        unit: r.unit,
        direction: r.direction,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
      }));
    },

    async getMetricById(orgId: string, id: string) {
      const rows = await sql<DbMetricDetailRow[]>`
    select
      id,
      name,
      unit,
      direction,
      created_at as "createdAt"
    from metrics
    where org_id = ${orgId}
      and id = ${id}
    limit 1
  `;

      const metric = rows[0];
      if (!metric) {
        throw new AppError('NOT_FOUND', 'Metric not found', 404);
      }

      const snapshots = await this.getLatestSnapshots(id, 30);
      const decisions = await this.listDecisionsForMetric(id);

      return {
        id: metric.id,
        name: metric.name,
        // description: metric.description ?? '',
        unit: metric.unit,
        direction: metric.direction,
        createdAt: toIsoOrNull(metric.createdAt) ?? '',
        snapshots,
        decisions,
      };
    },

    async listMetricsByInitiative(
      orgId: string,
      initiativeId: string,
    ): Promise<MetricListItem[]> {
      const rows = await sql<DbMetricRow[]>`
    select id, initiative_id as "initiativeId", name, unit, direction, created_at as "createdAt", created_by as "createdBy"
    from metrics
    where org_id = ${orgId}
      and initiative_id = ${initiativeId}
    order by created_at desc
    limit 200
  `;

      return rows.map((r) => ({
        id: r.id,
        initiativeId: r.initiativeId,
        name: r.name,
        unit: r.unit,
        direction: r.direction,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
      }));
    },

    async createSnapshot(p: {
      id: string;
      metricId: string;
      occurredAt: Date;
      value: number;
      source: string;
      createdBy: string;
    }) {
      await sql`
    insert into metric_snapshots (
      id,
      metric_id,
      occurred_at,
      value,
      source,
      created_by
    )
    values (
      ${p.id},
      ${p.metricId},
      ${p.occurredAt},
      ${p.value},
      ${p.source},
      ${p.createdBy}
    )
  `;
    },
    async listMetricsForDecision(
      decisionId: string,
    ): Promise<DecisionMetricLinkItem[]> {
      const rows = await sql<
        {
          id: string;
          metric_id: string;
          metric_name: string;
          metric_description: string | null;
          metric_unit: string;
          metric_direction: string;
          linked_at: Date | string | null;
        }[]
      >`
    select
      l.id,
      l.metric_id,
      m.name as metric_name,
      m.unit as metric_unit,
      m.direction as metric_direction,
      l.created_at as linked_at
    from decision_metric_links l
    join metrics m on m.id = l.metric_id
    where l.decision_id = ${decisionId}
    order by l.created_at desc
  `;

      const items: DecisionMetricLinkItem[] = [];

      for (const row of rows) {
        const snapshots = await this.getLatestSnapshots(row.metric_id, 1);
        const latest = snapshots[0] ?? null;

        items.push({
          id: row.id,
          metricId: row.metric_id,
          metricName: row.metric_name,
          metricUnit: row.metric_unit,
          metricDirection: row.metric_direction,
          linkedAt: toIsoOrNull(row.linked_at) ?? '',
          latestSnapshot: latest
            ? {
                id: latest.id,
                value: latest.value,
                occurredAt: latest.occurredAt,
                source: latest.source,
                createdAt: latest.createdAt,
              }
            : null,
        });
      }

      return items;
    },

    async getLatestSnapshots(
      metricId: string,
      limit = 30,
    ): Promise<MetricSnapshot[]> {
      const rows = await sql<DbMetricSnapshotRow[]>`
    select id, occurred_at as "occurredAt", value, source, created_at as "createdAt", created_by as "createdBy"
    from metric_snapshots
    where metric_id = ${metricId}
    order by occurred_at desc
    limit ${limit}
  `;

      return rows.map((r) => ({
        id: r.id,
        occurredAt: new Date(r.occurredAt).toISOString(),
        value: r.value,
        source: r.source,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
      }));
    },

    async linkDecision(p: {
      id: string;
      orgId: string;
      decisionId: string;
      initiativeId: string;
      createdBy: string;
    }) {
      await sql`
        insert into decision_links (id, org_id, decision_id, initiative_id, created_by)
        values (${p.id}, ${p.orgId}, ${p.decisionId}, ${p.initiativeId}, ${p.createdBy})
        on conflict (decision_id, initiative_id) do nothing
      `;
    },

    async linkDecisionToMetric(p: {
      id: string;
      orgId: string;
      decisionId: string;
      metricId: string;
      createdBy: string;
    }) {
      await sql`
    insert into decision_metric_links (
      id,
      org_id,
      decision_id,
      metric_id,
      created_by
    )
    values (
      ${p.id},
      ${p.orgId},
      ${p.decisionId},
      ${p.metricId},
      ${p.createdBy}
    )
    on conflict (decision_id, metric_id) do nothing
  `;
    },

    async listLinksForDecision(
      decisionId: string,
    ): Promise<DecisionLinkItem[]> {
      const rows = await sql<DbDecisionLinkRow[]>`
    select
      l.id,
      l.initiative_id,
      i.name as initiative_name,
      l.created_at
    from decision_links l
    join initiatives i on i.id = l.initiative_id
    where l.decision_id = ${decisionId}
    order by l.created_at desc
  `;

      return rows.map((r) => ({
        id: r.id,
        initiativeId: r.initiative_id,
        initiativeName: r.initiative_name,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
      }));
    },

    async listLinksForInitiative(initiativeId: string): Promise<
      {
        id: string;
        decisionId: string;
        decisionTitle: string;
        createdAt: string;
      }[]
    > {
      const rows = await sql<
        {
          id: string;
          decision_id: string;
          decision_title: string;
          created_at: Date | string | null;
        }[]
      >`
    select
      l.id,
      l.decision_id,
      d.title as decision_title,
      l.created_at
    from decision_links l
    join decisions d on d.id = l.decision_id
    where l.initiative_id = ${initiativeId}
    order by l.created_at desc
  `;

      return rows.map((r) => ({
        id: r.id,
        decisionId: r.decision_id,
        decisionTitle: r.decision_title,
        createdAt: toIsoOrNull(r.created_at) ?? '',
      }));
    },

    async listDecisionsForInitiative(
      initiativeId: string,
    ): Promise<DecisionListItem[]> {
      const rows = await sql<DbDecisionListRow[]>`
    select d.id, d.title, d.status, d.created_at
    from decision_links l
    join decisions d on d.id = l.decision_id
    where l.initiative_id = ${initiativeId}
    order by d.created_at desc
  `;

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        createdAt: toIsoOrNull(r.createdAt) ?? '',
      }));
    },

    async listDecisionsForMetric(
      metricId: string,
    ): Promise<MetricDecisionLinkItem[]> {
      const rows = await sql<
        {
          id: string;
          decision_id: string;
          decision_title: string;
          decision_status: string;
          created_at: Date | string | null;
        }[]
      >`
    select
      l.id,
      l.decision_id,
      d.title as decision_title,
      d.status as decision_status,
      l.created_at
    from decision_metric_links l
    join decisions d on d.id = l.decision_id
    where l.metric_id = ${metricId}
    order by l.created_at desc
  `;

      return rows.map((r) => ({
        id: r.id,
        decisionId: r.decision_id,
        decisionTitle: r.decision_title,
        decisionStatus: r.decision_status,
        createdAt: toIsoOrNull(r.created_at) ?? '',
      }));
    },
  };
}
