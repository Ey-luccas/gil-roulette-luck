const DEFAULT_WHATSAPP_NUMBER = "558589932940";

export const GC_INSTAGRAM_URL = "https://www.instagram.com/gc.conceito/";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function getWhatsAppNumber() {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const normalized = fromEnv ? digitsOnly(fromEnv) : "";

  if (normalized.length >= 10) {
    return normalized;
  }

  return DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(message: string) {
  const number = getWhatsAppNumber();
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
