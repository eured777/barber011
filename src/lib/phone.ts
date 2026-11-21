// WhatsApp do cliente: obrigatório, com DDD (10 ou 11 números). O banco valida a mesma regra.
export function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidWhatsApp(value: string) {
  const d = phoneDigits(value);
  return d.length === 10 || d.length === 11;
}

/** Máscara enquanto digita: (91) 99926-6351 */
export function formatPhone(value: string) {
  const d = phoneDigits(value);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Link do WhatsApp (Brasil) para um número salvo só com dígitos. */
export function whatsAppLink(value: string) {
  return `https://wa.me/55${phoneDigits(value)}`;
}
