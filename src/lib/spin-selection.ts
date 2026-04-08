import { SACOLA_ITEM_COUNT } from "@/lib/pricing";

export function getUniqueItemIds(itemIds: string[]) {
  return [...new Set(itemIds)];
}

export function hasValidFinalSelection(itemIds: string[]) {
  return getUniqueItemIds(itemIds).length === SACOLA_ITEM_COUNT;
}
