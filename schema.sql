create table if not exists bs_admin_users (
  id text primary key,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bs_store_config (
  id integer primary key default 1 check (id = 1),
  published jsonb not null,
  draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);
