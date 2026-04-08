import { formatCpf, isValidCpf, normalizeCpf } from "@/lib/cpf";
import { formatPhone, normalizePhone } from "@/lib/phone";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export { formatCpf, formatPhone, isValidCpf, normalizeCpf, normalizePhone };
