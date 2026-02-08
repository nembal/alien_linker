-- AlienClaw Linker — Initial Schema

-- clawbots: registered clawbot agents
create table clawbots (
  id uuid primary key default gen_random_uuid(),
  clawbot_id text unique not null,
  name text not null,
  description text,
  endpoint text,
  public_key text not null,
  claim_code text,
  claim_code_expires_at timestamptz,
  alien_id text,
  attestation jsonb,
  status text not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clawbots_alien_id on clawbots (alien_id);
create index idx_clawbots_claim_code on clawbots (claim_code) where claim_code is not null;
create index idx_clawbots_status on clawbots (status);

-- deploy_jobs: one-click deploy job tracking
create table deploy_jobs (
  id uuid primary key default gen_random_uuid(),
  alien_id text not null,
  clawbot_id text references clawbots(clawbot_id),
  config jsonb not null default '{}',
  provider text not null default 'manual',
  status text not null default 'pending',
  provider_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deploy_jobs_alien_id on deploy_jobs (alien_id);
create index idx_deploy_jobs_status on deploy_jobs (status);

-- attestation_keys: backend signing keypairs
create table attestation_keys (
  id uuid primary key default gen_random_uuid(),
  public_key text not null,
  private_key_ref text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clawbots_updated_at
  before update on clawbots
  for each row execute function set_updated_at();

create trigger trg_deploy_jobs_updated_at
  before update on deploy_jobs
  for each row execute function set_updated_at();

-- Enable RLS
alter table clawbots enable row level security;
alter table deploy_jobs enable row level security;
alter table attestation_keys enable row level security;
