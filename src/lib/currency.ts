const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number) {
  return brlFormatter.format(value);
}

export function formatCurrencyFromCents(valueInCents: number) {
  return formatBRL(valueInCents / 100);
}

export function parseDecimalToCents(raw: string) {
  const normalized = raw.replace(",", ".").trim();
  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return null;
  }

  return Math.round(numberValue * 100);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}
