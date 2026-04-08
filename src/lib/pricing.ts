import { formatBRL, formatPercent } from "@/lib/currency";

export const SACOLA_ITEM_COUNT = 3;
export const SACOLA_FINAL_PRICE = 150;

export function calculateDiscount(
  originalTotal: number,
  finalPrice: number = SACOLA_FINAL_PRICE
) {
  const discountAmount = Math.max(originalTotal - finalPrice, 0);
  const discountPercent = originalTotal === 0 ? 0 : (discountAmount / originalTotal) * 100;

  return {
    discountAmount,
    discountPercent,
  };
}

export function calculatePricingSummary(
  prices: number[],
  finalPrice: number = SACOLA_FINAL_PRICE
) {
  const originalTotal = prices.reduce((accumulator, value) => accumulator + value, 0);
  const { discountAmount, discountPercent } = calculateDiscount(originalTotal, finalPrice);

  return {
    originalTotal,
    finalPrice,
    savings: discountAmount,
    savingsPercent: discountPercent,
    discountAmount,
    discountPercent,
  };
}

export { formatBRL, formatPercent };
