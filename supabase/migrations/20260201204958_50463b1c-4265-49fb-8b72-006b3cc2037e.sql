-- === AXION / Dashboard - RLS tightening (still single-tenant) ===
-- Troca USING/WITH CHECK (true) por auth.uid() is not null

-- flow_cards
DROP POLICY IF EXISTS flow_cards_all_insert ON public.flow_cards;
DROP POLICY IF EXISTS flow_cards_all_update ON public.flow_cards;
DROP POLICY IF EXISTS flow_cards_all_delete ON public.flow_cards;
CREATE POLICY flow_cards_all_insert ON public.flow_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY flow_cards_all_update ON public.flow_cards FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY flow_cards_all_delete ON public.flow_cards FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- crm_leads
DROP POLICY IF EXISTS crm_leads_all_insert ON public.crm_leads;
DROP POLICY IF EXISTS crm_leads_all_update ON public.crm_leads;
DROP POLICY IF EXISTS crm_leads_all_delete ON public.crm_leads;
CREATE POLICY crm_leads_all_insert ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY crm_leads_all_update ON public.crm_leads FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY crm_leads_all_delete ON public.crm_leads FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- crm_clients
DROP POLICY IF EXISTS crm_clients_all_insert ON public.crm_clients;
DROP POLICY IF EXISTS crm_clients_all_update ON public.crm_clients;
DROP POLICY IF EXISTS crm_clients_all_delete ON public.crm_clients;
CREATE POLICY crm_clients_all_insert ON public.crm_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY crm_clients_all_update ON public.crm_clients FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY crm_clients_all_delete ON public.crm_clients FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- financial_transactions
DROP POLICY IF EXISTS financial_transactions_all_insert ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_all_update ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_all_delete ON public.financial_transactions;
CREATE POLICY financial_transactions_all_insert ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY financial_transactions_all_update ON public.financial_transactions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY financial_transactions_all_delete ON public.financial_transactions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- calendar_events
DROP POLICY IF EXISTS calendar_events_all_insert ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_all_update ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_all_delete ON public.calendar_events;
CREATE POLICY calendar_events_all_insert ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY calendar_events_all_update ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY calendar_events_all_delete ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- team_members
DROP POLICY IF EXISTS team_members_all_insert ON public.team_members;
DROP POLICY IF EXISTS team_members_all_update ON public.team_members;
DROP POLICY IF EXISTS team_members_all_delete ON public.team_members;
CREATE POLICY team_members_all_insert ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY team_members_all_update ON public.team_members FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY team_members_all_delete ON public.team_members FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- contracts
DROP POLICY IF EXISTS contracts_all_insert ON public.contracts;
DROP POLICY IF EXISTS contracts_all_update ON public.contracts;
DROP POLICY IF EXISTS contracts_all_delete ON public.contracts;
CREATE POLICY contracts_all_insert ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY contracts_all_update ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY contracts_all_delete ON public.contracts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
