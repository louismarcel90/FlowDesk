create table if not exists metric_snapshots (
  id text primary key,
  metric_id text not null references metrics(id) on delete cascade,
  occurred_at timestamptz not null,
  value double precision not null,
  source text not null, -- manual | import
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_metric_snapshots_metric on metric_snapshots(metric_id);
create index if not exists idx_metric_snapshots_time on metric_snapshots(occurred_at);
