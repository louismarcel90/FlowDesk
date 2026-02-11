create table if not exists decision_links (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  decision_id text not null references decisions(id) on delete cascade,
  initiative_id text not null references initiatives(id) on delete cascade,
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (decision_id, initiative_id)
);

create index if not exists idx_links_decision on decision_links(decision_id);
create index if not exists idx_links_initiative on decision_links(initiative_id);
