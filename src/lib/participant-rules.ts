import { createHash } from "node:crypto";

import { normalizeCpf, validateCpf } from "@/lib/cpf";

export function hashCpf(cpf: string) {
  return createHash("sha256").update(cpf).digest("hex");
}

export function normalizeAndValidateCpf(rawCpf: string) {
  const normalizedCpf = normalizeCpf(rawCpf);

  if (!validateCpf(normalizedCpf)) {
    return null;
  }

  return {
    normalizedCpf,
    cpfHash: hashCpf(normalizedCpf),
  };
}
