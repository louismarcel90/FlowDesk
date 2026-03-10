create table if not exists in_app_notifications (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,

  type text not null, -- e.g. decision.approved / metric.created
  title text not null,
  body text not null,

  entity_type text null, -- decision | initiative | metric
  entity_id text null,

  source_event_id text not null, -- outbox event id (trace)
  correlation_id text not null,

  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_inapp_user_unread
  on in_app_notifications(user_id, created_at desc)
  where read_at is null;

create index if not exists idx_inapp_user_all
  on in_app_notifications(user_id, created_at desc);

create index if not exists idx_inapp_source
  on in_app_notifications(source_event_id);
