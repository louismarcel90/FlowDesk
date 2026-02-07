-- Users
create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Orgs
create table if not exists orgs (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- Memberships (org-level RBAC)
-- roles: viewer | editor | approver | admin
create table if not exists memberships (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists idx_memberships_user on memberships(user_id);
create index if not exists idx_memberships_org on memberships(org_id);
