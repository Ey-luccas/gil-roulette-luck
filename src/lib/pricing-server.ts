import { Prisma } from "@prisma/client";

import { SACOLA_FINAL_PRICE } from "@/lib/pricing";

export const SACOLA_FINAL_PRICE_DECIMAL = new Prisma.Decimal(SACOLA_FINAL_PRICE.toFixed(2));

export function decimalToNumber(value: { toString(): string }) {
  return Number(value.toString());
}

export function calculatePricingSummaryDecimal(
  prices: Prisma.Decimal[],
  finalPrice: Prisma.Decimal = SACOLA_FINAL_PRICE_DECIMAL
) {
  const originalTotal = prices.reduce(
    (accumulator, value) => accumulator.plus(value),
    new Prisma.Decimal(0)
  );

  const discountAmount = originalTotal.greaterThan(finalPrice)
    ? originalTotal.minus(finalPrice)
    : new Prisma.Decimal(0);

  const discountPercent = originalTotal.greaterThan(0)
    ? discountAmount.div(originalTotal).mul(100)
    : new Prisma.Decimal(0);

  return {
    originalTotal,
    finalPrice,
    discountAmount,
    discountPercent,
  };
}
