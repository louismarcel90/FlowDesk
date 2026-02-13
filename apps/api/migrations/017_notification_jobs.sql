create table if not exists notification_jobs (
  id text primary key,
  notification_id text not null references notifications(id) on delete cascade,
  channel text not null, -- email
  attempt integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null,
  status text not null, -- pending | processing | done | dlq
  last_error text null,
  locked_at timestamptz null
);

create index if not exists idx_jobs_due on notification_jobs(next_attempt_at) where status = 'pending';
create index if not exists idx_jobs_status on notification_jobs(status);
