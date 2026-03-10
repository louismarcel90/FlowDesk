create table if not exists notification_deliveries (
  id text primary key,
  notification_id text not null references notifications(id) on delete cascade,
  channel text not null, -- email
  to_address text not null,
  template_id text not null, -- e.g. email/decision-approved
  template_version integer not null,
  status text not null, -- sent | failed
  sent_at timestamptz null,
  error text null,
  idempotency_key text not null,

  unique (idempotency_key)
);

create index if not exists idx_delivery_notification on notification_deliveries(notification_id);
