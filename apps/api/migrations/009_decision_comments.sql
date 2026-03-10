create table if not exists decision_comments (
  id text primary key,
  decision_id text not null references decisions(id) on delete cascade,
  created_by text not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  body text not null
);

create index if not exists idx_decision_comments_decision on decision_comments(decision_id);
