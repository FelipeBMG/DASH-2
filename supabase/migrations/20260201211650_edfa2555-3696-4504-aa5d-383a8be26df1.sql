-- Tabela para configurações de colaboradores (username/comissões)
CREATE TABLE IF NOT EXISTS public.collaborator_settings (
  user_id uuid PRIMARY KEY,
  username text NOT NULL,
  commission_percent numeric NULL,
  commission_fixed numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garante username único
CREATE UNIQUE INDEX IF NOT EXISTS collaborator_settings_username_key
  ON public.collaborator_settings (lower(username));

-- RLS
ALTER TABLE public.collaborator_settings ENABLE ROW LEVEL SECURITY;

-- Policies: admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='collaborator_settings' AND policyname='collaborator_settings_admin_select'
  ) THEN
    CREATE POLICY collaborator_settings_admin_select
    ON public.collaborator_settings
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='collaborator_settings' AND policyname='collaborator_settings_admin_insert'
  ) THEN
    CREATE POLICY collaborator_settings_admin_insert
    ON public.collaborator_settings
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='collaborator_settings' AND policyname='collaborator_settings_admin_update'
  ) THEN
    CREATE POLICY collaborator_settings_admin_update
    ON public.collaborator_settings
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='collaborator_settings' AND policyname='collaborator_settings_admin_delete'
  ) THEN
    CREATE POLICY collaborator_settings_admin_delete
    ON public.collaborator_settings
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Usuário pode ver o próprio registro (opcional, ajuda telas futuras)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='collaborator_settings' AND policyname='collaborator_settings_select_own'
  ) THEN
    CREATE POLICY collaborator_settings_select_own
    ON public.collaborator_settings
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Trigger helper (caso ainda não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_collaborator_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_collaborator_settings_updated_at
    BEFORE UPDATE ON public.collaborator_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;