import type { Prisma, PrismaClient } from "@prisma/client";

import {
  INITIAL_CAMPAIGN_PRIZES_STOCK,
  type CampaignPrizeStock,
} from "@/lib/presentes-campaign";

type DbClient = PrismaClient | Prisma.TransactionClient;

type CampaignPrizeRow = {
  id: string;
  name: string;
  note: string;
  quantity: number | null;
  isUnlimited: boolean;
};

function toCampaignStockRows(rows: CampaignPrizeRow[]) {
  const rowById = new Map(rows.map((row) => [row.id, row]));

  return INITIAL_CAMPAIGN_PRIZES_STOCK.map((defaultPrize) => {
    const row = rowById.get(defaultPrize.id);

    if (!row) {
      return {
        ...defaultPrize,
      };
    }

    return {
      id: row.id,
      name: row.name,
      note: row.note,
      quantity: row.isUnlimited ? null : row.quantity,
    } satisfies CampaignPrizeStock;
  });
}

export async function ensureCampaignPrizes(client: DbClient) {
  const existing = await client.campaignPrize.findMany({
    select: {
      id: true,
      name: true,
      note: true,
      quantity: true,
      isUnlimited: true,
    },
  });

  const existingById = new Map(existing.map((row) => [row.id, row]));

  const missing = INITIAL_CAMPAIGN_PRIZES_STOCK.filter((prize) => !existingById.has(prize.id));

  if (missing.length > 0) {
    await client.campaignPrize.createMany({
      data: missing.map((prize) => ({
        id: prize.id,
        name: prize.name,
        note: prize.note,
        quantity: prize.quantity,
        isUnlimited: prize.quantity === null,
      })),
      skipDuplicates: true,
    });
  }

  const existingRows = await client.campaignPrize.findMany({
    select: {
      id: true,
      name: true,
      note: true,
      quantity: true,
      isUnlimited: true,
    },
  });

  const updates: Prisma.PrismaPromise<{ id: string }>[] = [];

  for (const defaultPrize of INITIAL_CAMPAIGN_PRIZES_STOCK) {
    const row = existingRows.find((entry) => entry.id === defaultPrize.id);
    if (!row) {
      continue;
    }

    const shouldUpdateNameOrNote = row.name !== defaultPrize.name || row.note !== defaultPrize.note;
    const shouldUpdateUnlimitedFlag = row.isUnlimited !== (defaultPrize.quantity === null);

    if (!shouldUpdateNameOrNote && !shouldUpdateUnlimitedFlag) {
      continue;
    }

    updates.push(
      client.campaignPrize.update({
        where: { id: defaultPrize.id },
        data: {
          name: defaultPrize.name,
          note: defaultPrize.note,
          isUnlimited: defaultPrize.quantity === null,
        },
        select: { id: true },
      })
    );
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }

  const refreshedRows = await client.campaignPrize.findMany({
    select: {
      id: true,
      name: true,
      note: true,
      quantity: true,
      isUnlimited: true,
    },
  });

  return toCampaignStockRows(refreshedRows);
}

export async function drawCampaignPrizeWithStockControl(client: DbClient) {
  const MAX_DRAW_RETRIES = 20;

  for (let attempt = 0; attempt < MAX_DRAW_RETRIES; attempt += 1) {
    const stock = await ensureCampaignPrizes(client);
    const available = stock.filter((prize) => prize.quantity === null || prize.quantity > 0);

    if (available.length === 0) {
      return null;
    }

    const selected = available[Math.floor(Math.random() * available.length)] as CampaignPrizeStock;

    if (selected.quantity === null) {
      return {
        selectedPrize: selected,
        updatedStock: stock,
      };
    }

    const updated = await client.campaignPrize.updateMany({
      where: {
        id: selected.id,
        quantity: {
          gt: 0,
        },
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });

    if (updated.count === 1) {
      const refreshedStock = await ensureCampaignPrizes(client);

      return {
        selectedPrize: selected,
        updatedStock: refreshedStock,
      };
    }
  }

  return null;
}
