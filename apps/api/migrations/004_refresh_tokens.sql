create table if not exists refresh_tokens (
  id text primary key, -- jti
  user_id text not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_user on refresh_tokens(user_id);
create index if not exists idx_refresh_tokens_valid on refresh_tokens(user_id, revoked_at) where revoked_at is null;
