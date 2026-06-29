create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nom           text not null,
  role          text not null default 'client' check (role in ('admin', 'commercial', 'client')),
  organisation  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom, role, organisation)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'organisation'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── leads ────────────────────────────────────────────────────────────────────

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  nom              text not null,
  societe          text,
  email            text not null,
  telephone        text not null default '',
  depart           text not null,
  destination      text not null,
  date_depart      text not null,
  date_retour      text,
  nb_passagers     integer not null check (nb_passagers >= 1),
  type_trajet      text not null check (type_trajet in ('aller_simple', 'aller_retour', 'circuit')),
  urgence          text not null default 'normal' check (urgence in ('normal', 'urgent', 'tres_urgent', 'prioritaire', 'anticipation')),
  options          jsonb not null default '[]',
  commentaire      text,
  statut           text not null default 'nouveau',
  score_completude integer not null default 0,
  user_id          uuid references auth.users(id) on delete set null,
  tracking_token   text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists leads_email_idx         on public.leads(email);
create index if not exists leads_statut_idx        on public.leads(statut);
create index if not exists leads_user_id_idx       on public.leads(user_id);
create index if not exists leads_tracking_token_idx on public.leads(tracking_token);

-- ─── quotes ───────────────────────────────────────────────────────────────────

create table if not exists public.quotes (
  id                     uuid primary key default gen_random_uuid(),
  lead_id                uuid not null references public.leads(id) on delete cascade,
  source                 text not null default 'auto',
  prix_ht                numeric(10,2) not null,
  tva                    numeric(10,2) not null,
  prix_ttc               numeric(10,2) not null,
  lignes_calcul          jsonb not null default '[]',
  coefficients           jsonb not null default '{}',
  warnings               jsonb not null default '[]',
  besoin_reprise_humaine boolean not null default false,
  raison_reprise_humaine text,
  sources_calcul         jsonb not null default '[]',
  explication_calcul     text,
  statut_devis           text not null default 'genere',
  validite_jours         integer not null default 30,
  email_sent_at          timestamptz,
  ajustement_manuel_ht   numeric(10,2) not null default 0,
  raison_ajustement      text,
  prix_final_ht          numeric(10,2) not null default 0,
  prix_final_ttc         numeric(10,2) not null default 0,
  modified_by            uuid references auth.users(id),
  modified_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists quotes_lead_id_idx on public.quotes(lead_id);

-- ─── logs ─────────────────────────────────────────────────────────────────────

create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  lead_id    uuid references public.leads(id) on delete set null,
  payload    jsonb,
  status     text not null default 'info' check (status in ('success', 'error', 'info', 'warning')),
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists logs_lead_id_idx  on public.logs(lead_id);
create index if not exists logs_action_idx   on public.logs(action);
create index if not exists logs_created_idx  on public.logs(created_at desc);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at  on public.leads;
create trigger set_leads_updated_at  before update on public.leads  for each row execute procedure public.set_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at before update on public.quotes for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Backend uses service_role key → bypasses RLS.
-- Frontend (anon/user) reads only their own data.

alter table public.profiles enable row level security;
alter table public.leads    enable row level security;
alter table public.quotes   enable row level security;
alter table public.logs     enable row level security;

-- profiles: users see/update their own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- leads: clients see their own; anonymous tracking via token handled by backend
create policy "leads_select_own" on public.leads for select using (auth.uid() = user_id);
create policy "leads_insert_anon" on public.leads for insert with check (true);

-- quotes: clients see quotes linked to their leads
create policy "quotes_select_own" on public.quotes for select using (
  exists (select 1 from public.leads where leads.id = quotes.lead_id and leads.user_id = auth.uid())
);

-- logs: no direct client access (service_role only)
-- (no permissive policies = deny by default for non-service_role)
