create table if not exists metrics (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  initiative_id text null references initiatives(id) on delete set null,
  name text not null,
  unit text not null,
  direction text not null, -- up|down (higher is better / lower is better)
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_metrics_org on metrics(org_id);
create index if not exists idx_metrics_initiative on metrics(initiative_id);
