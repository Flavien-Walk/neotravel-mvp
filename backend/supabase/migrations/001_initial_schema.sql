create extension if not exists "pgcrypto";


create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nom           text not null,
  organisation  text,
  role          text not null default 'client' check (role in ('admin', 'commercial', 'client')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read/update their own profile; staff can read all
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);
create policy "profiles: staff read" on public.profiles for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'commercial'))
);

-- Trigger: auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nom, organisation, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', new.email),
    new.raw_user_meta_data->>'organisation',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── leads ───────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  nom               text not null,
  societe           text,
  email             text not null,
  telephone         text not null default '',
  depart            text not null,
  destination       text not null,
  date_depart       text not null,
  date_retour       text,
  nb_passagers      integer not null check (nb_passagers >= 1 and nb_passagers <= 500),
  type_trajet       text not null check (type_trajet in ('aller_simple', 'aller_retour', 'circuit')),
  urgence           text not null default 'normal' check (urgence in ('normal', 'urgent', 'tres_urgent')),
  options           text[] not null default '{}',
  commentaire       text,
  statut            text not null default 'nouveau',
  score_completude  integer not null default 0,
  user_id           uuid references auth.users(id) on delete set null,
  tracking_token    text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Public can insert (anonymous lead submission)
create policy "leads: public insert"   on public.leads for insert with check (true);
-- Clients see only their own leads
create policy "leads: client select"   on public.leads for select using (
  auth.uid() = user_id
);
-- Staff see all leads
create policy "leads: staff select"    on public.leads for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'commercial'))
);
-- Staff can update leads
create policy "leads: staff update"    on public.leads for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'commercial'))
);
-- Public tracking read by token (handled via service role in API, no RLS needed for anon token lookup)

create index if not exists leads_email_idx         on public.leads(email);
create index if not exists leads_user_id_idx       on public.leads(user_id);
create index if not exists leads_statut_idx        on public.leads(statut);
create index if not exists leads_tracking_token_idx on public.leads(tracking_token);

-- ─── quotes ──────────────────────────────────────────────────────────────────
create table if not exists public.quotes (
  id                      uuid primary key default gen_random_uuid(),
  lead_id                 uuid not null references public.leads(id) on delete cascade,
  source                  text not null default 'auto',
  prix_ht                 numeric(10,2) not null,
  tva                     numeric(10,2) not null,
  prix_ttc                numeric(10,2) not null,
  lignes_calcul           jsonb not null default '[]',
  coefficients            jsonb not null default '{}',
  warnings                text[] not null default '{}',
  besoin_reprise_humaine  boolean not null default false,
  raison_reprise_humaine  text,
  sources_calcul          jsonb not null default '[]',
  explication_calcul      text,
  statut_devis            text not null default 'genere',
  validite_jours          integer not null default 30,
  email_sent_at           timestamptz,
  ajustement_manuel_ht    numeric(10,2) not null default 0,
  raison_ajustement       text,
  prix_final_ht           numeric(10,2) not null default 0,
  prix_final_ttc          numeric(10,2) not null default 0,
  modified_by             uuid references auth.users(id),
  modified_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.quotes enable row level security;

-- Staff can read/write all quotes
create policy "quotes: staff all"   on public.quotes for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'commercial'))
);
-- Clients can read quotes for their own leads
create policy "quotes: client read" on public.quotes for select using (
  exists (select 1 from public.leads l where l.id = lead_id and l.user_id = auth.uid())
);

create index if not exists quotes_lead_id_idx on public.quotes(lead_id);

-- ─── logs ────────────────────────────────────────────────────────────────────
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  lead_id    uuid references public.leads(id) on delete set null,
  payload    jsonb,
  status     text not null default 'info' check (status in ('success', 'error', 'info', 'warning')),
  message    text not null,
  timestamp  timestamptz not null default now()
);

alter table public.logs enable row level security;

-- Only staff can read logs
create policy "logs: staff select" on public.logs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'commercial'))
);
-- Service role (backend) can insert — bypasses RLS
create policy "logs: insert all"   on public.logs for insert with check (true);

create index if not exists logs_lead_id_idx  on public.logs(lead_id);
create index if not exists logs_status_idx   on public.logs(status);
create index if not exists logs_timestamp_idx on public.logs(timestamp desc);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at  before update on public.leads  for each row execute procedure public.set_updated_at();
create trigger quotes_updated_at before update on public.quotes for each row execute procedure public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
