-- AXION: schema base (single-tenant) + auditoria (v1)
-- Rode este SQL no seu backend (SQL Editor) no ambiente desejado.

-- Extensões
create extension if not exists pgcrypto;

-- =========================
-- Roles (já existe no projeto, mas mantemos aqui como referência)
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'seller', 'production');
  end if;
end$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- User roles policies
drop policy if exists "roles_read_own" on public.user_roles;
create policy "roles_read_own" on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "roles_admin_manage" on public.user_roles;
create policy "roles_admin_manage" on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- =========================
-- Audit log (cliente + triggers)
-- =========================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  entity text not null,
  entity_id text null,
  action text not null,
  before jsonb null,
  after jsonb null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "audit_select_authed" on public.audit_log;
create policy "audit_select_authed" on public.audit_log
for select
to authenticated
using (true);

drop policy if exists "audit_insert_own" on public.audit_log;
create policy "audit_insert_own" on public.audit_log
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "audit_admin_write" on public.audit_log;
create policy "audit_admin_write" on public.audit_log
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "audit_admin_delete" on public.audit_log;
create policy "audit_admin_delete" on public.audit_log
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Helper para logging em triggers (usa auth.uid())
create or replace function public.log_audit(_module text, _entity text, _entity_id text, _action text, _before jsonb, _after jsonb, _meta jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log(user_id, module, entity, entity_id, action, before, after, meta)
  values (auth.uid(), _module, _entity, _entity_id, _action, _before, _after, _meta);
end;
$$;

-- =========================
-- Fluxo de Operações (Flow Cards)
-- =========================
create table if not exists public.flow_cards (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  client_name text not null,
  leads_count int not null default 1,
  quantity int not null default 1,
  entry_value numeric not null default 0,
  category text null,
  status text not null,
  created_by_id uuid references auth.users(id) on delete set null,
  created_by_name text null,
  attendant_id text null,
  attendant_name text null,
  production_responsible_id text null,
  production_responsible_name text null,
  deadline date null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flow_cards enable row level security;

drop policy if exists "flow_cards_authed_all" on public.flow_cards;
create policy "flow_cards_authed_all" on public.flow_cards
for all
to authenticated
using (true)
with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_flow_cards_updated_at on public.flow_cards;
create trigger trg_flow_cards_updated_at
before update on public.flow_cards
for each row
execute function public.set_updated_at();

-- Auditoria por trigger (CRUD)
create or replace function public.trg_audit_flow_cards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _id text;
begin
  _id := coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, null);

  if (tg_op = 'INSERT') then
    perform public.log_audit('fluxo', 'flow_card', _id, 'created', null, to_jsonb(new), jsonb_build_object('trigger', true));
    return new;
  elsif (tg_op = 'UPDATE') then
    perform public.log_audit('fluxo', 'flow_card', _id, 'updated', to_jsonb(old), to_jsonb(new), jsonb_build_object('trigger', true));
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.log_audit('fluxo', 'flow_card', _id, 'deleted', to_jsonb(old), null, jsonb_build_object('trigger', true));
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_audit_flow_cards on public.flow_cards;
create trigger trg_audit_flow_cards
after insert or update or delete on public.flow_cards
for each row
execute function public.trg_audit_flow_cards();
