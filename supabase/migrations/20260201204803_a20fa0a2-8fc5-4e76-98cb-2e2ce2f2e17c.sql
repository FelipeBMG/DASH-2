-- === AXION / Dashboard - Schema completo (single-tenant) v2 ===

create extension if not exists pgcrypto;

-- 1) Enum de papéis
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','seller','production');
  END IF;
END $$;

-- 2) user_roles (sem FK em auth.users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) has_role helper (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  )
$$;

-- Policies user_roles
DROP POLICY IF EXISTS user_roles_select_own_or_admin ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;

CREATE POLICY user_roles_select_own_or_admin
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_insert
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_update
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_delete
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4) Bootstrap do primeiro admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_has_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
  INTO already_has_admin;

  IF already_has_admin THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- 5) user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_upsert_own ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;

CREATE POLICY user_profiles_select_own
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY user_profiles_upsert_own
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_profiles_update_own
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 6) audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_insert_own ON public.audit_log;
DROP POLICY IF EXISTS audit_log_select_admin ON public.audit_log;

CREATE POLICY audit_log_insert_own
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY audit_log_select_admin
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7) flow_cards
CREATE TABLE IF NOT EXISTS public.flow_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  client_name text NOT NULL DEFAULT '',
  leads_count int NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  entry_value numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'leads',
  attendant_id uuid,
  attendant_name text,
  production_responsible_id uuid,
  production_responsible_name text,
  deadline date,
  notes text,
  created_by_id uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flow_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flow_cards_all_select ON public.flow_cards;
DROP POLICY IF EXISTS flow_cards_all_insert ON public.flow_cards;
DROP POLICY IF EXISTS flow_cards_all_update ON public.flow_cards;
DROP POLICY IF EXISTS flow_cards_all_delete ON public.flow_cards;

CREATE POLICY flow_cards_all_select ON public.flow_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY flow_cards_all_insert ON public.flow_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY flow_cards_all_update ON public.flow_cards FOR UPDATE TO authenticated USING (true);
CREATE POLICY flow_cards_all_delete ON public.flow_cards FOR DELETE TO authenticated USING (true);

-- 8) CRM
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'new',
  value numeric NOT NULL DEFAULT 0,
  notes text,
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_leads_all_select ON public.crm_leads;
DROP POLICY IF EXISTS crm_leads_all_insert ON public.crm_leads;
DROP POLICY IF EXISTS crm_leads_all_update ON public.crm_leads;
DROP POLICY IF EXISTS crm_leads_all_delete ON public.crm_leads;

CREATE POLICY crm_leads_all_select ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY crm_leads_all_insert ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY crm_leads_all_update ON public.crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY crm_leads_all_delete ON public.crm_leads FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.crm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_clients_all_select ON public.crm_clients;
DROP POLICY IF EXISTS crm_clients_all_insert ON public.crm_clients;
DROP POLICY IF EXISTS crm_clients_all_update ON public.crm_clients;
DROP POLICY IF EXISTS crm_clients_all_delete ON public.crm_clients;

CREATE POLICY crm_clients_all_select ON public.crm_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY crm_clients_all_insert ON public.crm_clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY crm_clients_all_update ON public.crm_clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY crm_clients_all_delete ON public.crm_clients FOR DELETE TO authenticated USING (true);

-- 9) Financeiro
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  date date NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  cost_center text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_transactions_all_select ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_all_insert ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_all_update ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_all_delete ON public.financial_transactions;

CREATE POLICY financial_transactions_all_select ON public.financial_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY financial_transactions_all_insert ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY financial_transactions_all_update ON public.financial_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY financial_transactions_all_delete ON public.financial_transactions FOR DELETE TO authenticated USING (true);

-- 10) Calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_all_select ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_all_insert ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_all_update ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_all_delete ON public.calendar_events;

CREATE POLICY calendar_events_all_select ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY calendar_events_all_insert ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY calendar_events_all_update ON public.calendar_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY calendar_events_all_delete ON public.calendar_events FOR DELETE TO authenticated USING (true);

-- 11) Equipe
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  fixed_cost numeric NOT NULL DEFAULT 0,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_all_select ON public.team_members;
DROP POLICY IF EXISTS team_members_all_insert ON public.team_members;
DROP POLICY IF EXISTS team_members_all_update ON public.team_members;
DROP POLICY IF EXISTS team_members_all_delete ON public.team_members;

CREATE POLICY team_members_all_select ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY team_members_all_insert ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY team_members_all_update ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY team_members_all_delete ON public.team_members FOR DELETE TO authenticated USING (true);

-- 12) Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  total_value numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_all_select ON public.contracts;
DROP POLICY IF EXISTS contracts_all_insert ON public.contracts;
DROP POLICY IF EXISTS contracts_all_update ON public.contracts;
DROP POLICY IF EXISTS contracts_all_delete ON public.contracts;

CREATE POLICY contracts_all_select ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY contracts_all_insert ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY contracts_all_update ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY contracts_all_delete ON public.contracts FOR DELETE TO authenticated USING (true);

-- 13) App settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'AXION Agency',
  tax_rate numeric NOT NULL DEFAULT 15,
  currency text NOT NULL DEFAULT 'BRL',
  signup_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_all_select ON public.app_settings;
DROP POLICY IF EXISTS app_settings_admin_insert ON public.app_settings;
DROP POLICY IF EXISTS app_settings_admin_update ON public.app_settings;
DROP POLICY IF EXISTS app_settings_admin_delete ON public.app_settings;

CREATE POLICY app_settings_all_select ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY app_settings_admin_insert ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY app_settings_admin_update ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY app_settings_admin_delete ON public.app_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed idempotente
INSERT INTO public.app_settings (company_name, tax_rate, currency, signup_enabled)
SELECT 'AXION Agency', 15, 'BRL', false
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
