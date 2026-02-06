create table if not exists audit_events (
  id text primary key,
  occurred_at timestamptz not null,
  actor_user_id text null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  correlation_id text not null,
  payload jsonb not null
);

create index if not exists idx_audit_entity
  on audit_events (entity_type, entity_id);

create index if not exists idx_audit_corr
  on audit_events (correlation_id);
