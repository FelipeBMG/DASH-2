export function normalizeBrazilPhoneToE164(raw: string) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;

  // Se já vier com 55 + DDD + número
  if (digits.startsWith("55") && digits.length >= 12) return digits;

  // Caso comum BR: DDD (2) + número (8/9) => 10/11
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  // fallback: tenta usar como veio
  return digits;
}

export function buildWaMeUrl(phoneE164Digits: string, message?: string) {
  // `wa.me` funciona em desktop e mobile e costuma ser o link mais estável.
  const base = `https://wa.me/${phoneE164Digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
