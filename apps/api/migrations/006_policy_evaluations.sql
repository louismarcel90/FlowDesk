create table if not exists policy_evaluations (
  id text primary key,
  occurred_at timestamptz not null default now(),

  user_id text null,
  org_id text null,

  action text not null,
  resource_type text not null,
  resource_id text not null,

  allow boolean not null,
  reason text null,
  rule text null,

  correlation_id text not null,
  input jsonb not null,
  result jsonb not null
);

create index if not exists idx_policy_eval_corr on policy_evaluations(correlation_id);
create index if not exists idx_policy_eval_user on policy_evaluations(user_id);
create index if not exists idx_policy_eval_org on policy_evaluations(org_id);
