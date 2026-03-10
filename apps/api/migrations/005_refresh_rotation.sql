alter table refresh_tokens
  add column if not exists org_id text null,
  add column if not exists replaced_by text null,
  add column if not exists last_used_at timestamptz null;

create index if not exists idx_refresh_tokens_org on refresh_tokens(org_id);

-- Optionnel: empêcher qu'un token soit remplacé deux fois (weak guard)
create index if not exists idx_refresh_tokens_replaced_by on refresh_tokens(replaced_by);
