import type { Sql } from '../../db/client';

export type InitiativeStatus = "draft" | "active" | "archived";


export type Initiative = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: InitiativeStatus;
  createdAt: string; 
};

type DbInitiativeRow = {
  id: string;
  org_id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string; 
};

type DbMetricRow = {
  id: string;
  initiative_id: string;
  name: string;
  unit: string;
  direction: string;
  createdAt: string; 
};

type DbMetricSnapshotRow = {
  id: string;
  occurred_at: string;
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

export type DecisionListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string; 
};



export function buildImpactRepo(sql: Sql) {
  return {
    async createInitiative(p: { id: string; orgId: string; name: string; description: string; status: string; createdBy: string }) {
      await sql`
        insert into initiatives (id, org_id, name, description, status, created_by)
        values (${p.id}, ${p.orgId}, ${p.name}, ${p.description}, ${p.status}, ${p.createdBy})
      `;
    },

    async listInitiatives(orgId: string): Promise<Initiative[]> {
  const rows = await sql<DbInitiativeRow[]>`
    select id, org_id, name, description, status, created_at
    from initiatives
    where org_id = ${orgId}
    order by created_at desc
    limit 100
  `;

  return rows.map((r) => ({
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    description: r.description,
    status: r.status as InitiativeStatus,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
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

  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    description: r.description,
    status: r.status as InitiativeStatus,
    createdAt: new Date(r.createdAt).toISOString(),
  };
},

    async createMetric(p: { id: string; orgId: string; initiativeId?: string; name: string; unit: string; direction: string; createdBy: string }) {
      await sql`
        insert into metrics (id, org_id, initiative_id, name, unit, direction, created_by)
        values (${p.id}, ${p.orgId}, ${p.initiativeId ?? null}, ${p.name}, ${p.unit}, ${p.direction}, ${p.createdBy})
      `;
    },

    async listMetrics(orgId: string): Promise<MetricListItem[]> {
  const rows = await sql<DbMetricRow[]>`
    select id, initiative_id, name, unit, direction, created_at
    from metrics
    where org_id = ${orgId}
    order by created_at desc
    limit 200
  `;

  return rows.map((r) => ({
    id: r.id,
    initiativeId: r.initiative_id,
    name: r.name,
    unit: r.unit,
    direction: r.direction,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
},

    async listMetricsByInitiative(initiativeId: string): Promise<MetricListItem[]> {
  const rows = await sql<DbMetricRow[]>`
    select id, initiative_id, name, unit, direction, created_at
    from metrics
    where initiative_id = ${initiativeId}
    order by created_at desc
  `;

  return rows.map((r) => ({
    id: r.id,
    initiativeId: r.initiative_id,
    name: r.name,
    unit: r.unit,
    direction: r.direction,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
},

    async createSnapshot(p: { id: string; metricId: string; occurredAt: Date; value: number; source: string; createdBy: string }) {
      await sql`
        insert into metric_snapshots (id, metric_id, occurred_at, value, source, created_by)
        values (${p.id}, ${p.metricId}, ${p.occurredAt}, ${p.value}, ${p.source}, ${p.createdBy})
      `;
    },

    async getLatestSnapshots(metricId: string, limit = 30): Promise<MetricSnapshot[]> {
  const rows = await sql<DbMetricSnapshotRow[]>`
    select id, occurred_at, value, source, created_at
    from metric_snapshots
    where metric_id = ${metricId}
    order by occurred_at desc
    limit ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    occurredAt: new Date(r.occurred_at).toISOString(),
    value: r.value,
    source: r.source,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
},

    async linkDecision(p: { id: string; orgId: string; decisionId: string; initiativeId: string; createdBy: string }) {
      await sql`
        insert into decision_links (id, org_id, decision_id, initiative_id, created_by)
        values (${p.id}, ${p.orgId}, ${p.decisionId}, ${p.initiativeId}, ${p.createdBy})
        on conflict (decision_id, initiative_id) do nothing
      `;
    },

    async listLinksForDecision(decisionId: string): Promise<DecisionLinkItem[]> {
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
    createdAt: new Date(r.createdAt).toISOString(),
  }));
},

    async listDecisionsForInitiative(initiativeId: string): Promise<DecisionListItem[]> {
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
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}
  };
}
 