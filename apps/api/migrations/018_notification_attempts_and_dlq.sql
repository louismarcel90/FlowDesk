create table if not exists notification_attempts (
  id text primary key,
  job_id text not null references notification_jobs(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  success boolean not null,
  error text null
);

create table if not exists notification_dlq (
  id text primary key,
  job_id text not null,
  notification_id text not null,
  channel text not null,
  reason text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  reprocessed_at timestamptz null
);
