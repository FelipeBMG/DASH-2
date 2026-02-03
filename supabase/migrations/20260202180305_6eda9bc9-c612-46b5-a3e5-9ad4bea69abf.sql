-- Add payment method to flow cards
ALTER TABLE public.flow_cards
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT '';

-- Optional helper index for filtering/reporting by payment method
CREATE INDEX IF NOT EXISTS idx_flow_cards_payment_method
ON public.flow_cards (payment_method);
