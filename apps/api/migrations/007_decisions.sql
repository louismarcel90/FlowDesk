create table if not exists decisions (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  title text not null,
  status text not null, -- draft | approved | deprecated
  created_by text not null references users(id) on delete restrict,
  approved_by text null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_at timestamptz null
);

create index if not exists idx_decisions_org on decisions(org_id);
create index if not exists idx_decisions_status on decisions(status);
