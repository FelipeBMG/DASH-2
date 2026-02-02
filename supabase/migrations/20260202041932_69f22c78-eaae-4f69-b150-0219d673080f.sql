ALTER TABLE public.flow_cards
ADD COLUMN IF NOT EXISTS whatsapp TEXT NULL;

COMMENT ON COLUMN public.flow_cards.whatsapp IS 'Número de WhatsApp do cliente (somente dígitos ou texto livre).';
