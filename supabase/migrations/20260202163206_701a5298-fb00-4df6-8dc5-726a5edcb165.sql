ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS received_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_value numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions (date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions (type);