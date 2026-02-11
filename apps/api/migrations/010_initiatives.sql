create table if not exists initiatives (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  name text not null,
  description text not null,
  status text not null, -- planned | active | done
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_initiatives_org on initiatives(org_id);
create index if not exists idx_initiatives_status on initiatives(status);
