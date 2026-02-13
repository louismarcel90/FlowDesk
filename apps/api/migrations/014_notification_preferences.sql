create table if not exists notification_preferences (
  id text primary key,
  org_id text not null references orgs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,

  email_enabled boolean not null default true,

  quiet_hours_start text null, -- "22:00"
  quiet_hours_end text null,   -- "07:00"
  timezone text not null default 'America/New_York',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, user_id)
);

create index if not exists idx_notif_prefs_user on notification_preferences(user_id);
