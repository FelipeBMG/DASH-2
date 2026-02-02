-- Products master data
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_name_unique UNIQUE (name)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user (needed for seller/production forms)
CREATE POLICY "products_select_authenticated"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admin-only writes
CREATE POLICY "products_admin_insert"
ON public.products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "products_admin_update"
ON public.products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "products_admin_delete"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep updated_at correct
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Flow cards: add product reference
ALTER TABLE public.flow_cards
ADD COLUMN IF NOT EXISTS product_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'flow_cards_product_id_fkey'
  ) THEN
    ALTER TABLE public.flow_cards
    ADD CONSTRAINT flow_cards_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_flow_cards_product_id ON public.flow_cards(product_id);
