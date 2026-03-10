create table if not exists notifications (
  id text primary key, -- notificationId (trace)
  org_id text not null references orgs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,

  type text not null, -- e.g. decision.approved
  created_at timestamptz not null default now(),

  correlation_id text not null,
  source_event_id text not null, -- outbox_events.id
  payload jsonb not null
);

create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_source on notifications(source_event_id);
