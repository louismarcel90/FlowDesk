create table if not exists decision_versions (
  id text primary key,
  decision_id text not null references decisions(id) on delete cascade,
  version integer not null,
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),

  context jsonb not null,      -- structured context
  options jsonb not null,      -- list of options
  tradeoffs jsonb not null,    -- list of tradeoffs
  assumptions jsonb not null,  -- list of assumptions
  risks jsonb not null,        -- list of risks
  outcome jsonb not null       -- outcome (empty in draft ok)
);

create unique index if not exists uq_decision_versions on decision_versions(decision_id, version);
create index if not exists idx_decision_versions_decision on decision_versions(decision_id);
