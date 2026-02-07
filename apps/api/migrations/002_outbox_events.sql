create table if not exists outbox_events (
  id text primary key,
  occurred_at timestamptz not null,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null,
  correlation_id text not null,
  published_at timestamptz null
);

create index if not exists idx_outbox_unpublished on outbox_events(published_at) where published_at is null;
create index if not exists idx_outbox_corr on outbox_events(correlation_id);
