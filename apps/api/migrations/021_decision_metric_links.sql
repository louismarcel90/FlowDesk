create table if not exists decision_metric_links (
  id text primary key,

  org_id text not null,

  decision_id text not null,
  metric_id text not null,

  created_by text not null,
  created_at timestamptz not null default now(),

  constraint decision_metric_unique unique (decision_id, metric_id),

  constraint fk_decision_metric_decision
    foreign key (decision_id)
    references decisions(id)
    on delete cascade,

  constraint fk_decision_metric_metric
    foreign key (metric_id)
    references metrics(id)
    on delete cascade
);

create index if not exists idx_decision_metric_org
  on decision_metric_links(org_id);

create index if not exists idx_decision_metric_decision
  on decision_metric_links(decision_id);

create index if not exists idx_decision_metric_metric
  on decision_metric_links(metric_id);