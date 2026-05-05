import {
  CAMPAIGN_ACTIVE_CPF_STORAGE_KEY,
  CAMPAIGN_PARTICIPANTS_STORAGE_KEY,
  CAMPAIGN_PRIZES_STOCK_STORAGE_KEY,
  cloneInitialCampaignPrizesStock,
  type CampaignParticipant,
  type CampaignParticipantSpin,
  type CampaignPrizeStock,
} from "@/lib/presentes-campaign";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorageItem(key: string) {
  if (!canUseLocalStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string) {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage indisponivel: segue sem persistir.
  }
}

function sanitizeSpin(value: unknown): CampaignParticipantSpin | null {
  if (!value || typeof value !== "object") return null;

  const spin = value as Record<string, unknown>;

  if (typeof spin.prize !== "string" || typeof spin.date !== "string") {
    return null;
  }

  return {
    prize: spin.prize,
    prizeId: typeof spin.prizeId === "string" ? spin.prizeId : "",
    note: typeof spin.note === "string" ? spin.note : "",
    date: spin.date,
  };
}

function sanitizeParticipant(value: unknown): CampaignParticipant | null {
  if (!value || typeof value !== "object") return null;

  const participant = value as Record<string, unknown>;

  if (
    typeof participant.name !== "string" ||
    typeof participant.phone !== "string" ||
    typeof participant.cpf !== "string" ||
    !Array.isArray(participant.spins)
  ) {
    return null;
  }

  const sanitizedSpins = participant.spins
    .map((entry) => sanitizeSpin(entry))
    .filter((entry): entry is CampaignParticipantSpin => entry !== null);

  return {
    name: participant.name,
    phone: participant.phone,
    cpf: participant.cpf,
    spins: sanitizedSpins,
  };
}

function sanitizePrize(value: unknown): CampaignPrizeStock | null {
  if (!value || typeof value !== "object") return null;

  const prize = value as Record<string, unknown>;
  const quantity = prize.quantity;

  const normalizedQuantity =
    quantity === null
      ? null
      : typeof quantity === "number" && Number.isFinite(quantity)
        ? Math.max(0, Math.floor(quantity))
        : null;

  if (typeof prize.id !== "string" || typeof prize.name !== "string" || typeof prize.note !== "string") {
    return null;
  }

  return {
    id: prize.id,
    name: prize.name,
    quantity: normalizedQuantity,
    note: prize.note,
  };
}

export function loadCampaignParticipants() {
  const raw = readStorageItem(CAMPAIGN_PARTICIPANTS_STORAGE_KEY);

  if (!raw) {
    return [] as CampaignParticipant[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as CampaignParticipant[];
    }

    return parsed
      .map((entry) => sanitizeParticipant(entry))
      .filter((entry): entry is CampaignParticipant => entry !== null);
  } catch {
    return [] as CampaignParticipant[];
  }
}

export function saveCampaignParticipants(participants: CampaignParticipant[]) {
  writeStorageItem(CAMPAIGN_PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants));
}

function buildMergedPrizesStock(storedPrizes: CampaignPrizeStock[]) {
  const stockById = new Map(storedPrizes.map((prize) => [prize.id, prize]));

  return cloneInitialCampaignPrizesStock().map((basePrize) => {
    const saved = stockById.get(basePrize.id);

    if (!saved) {
      return basePrize;
    }

    if (basePrize.quantity === null) {
      return {
        ...basePrize,
        name: saved.name,
        note: saved.note,
        quantity: null,
      };
    }

    if (saved.quantity === null) {
      return basePrize;
    }

    return {
      ...basePrize,
      name: saved.name,
      note: saved.note,
      quantity: Math.max(0, Math.floor(saved.quantity)),
    };
  });
}

export function loadCampaignPrizesStock() {
  const raw = readStorageItem(CAMPAIGN_PRIZES_STOCK_STORAGE_KEY);

  if (!raw) {
    const fallback = cloneInitialCampaignPrizesStock();
    saveCampaignPrizesStock(fallback);
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      const fallback = cloneInitialCampaignPrizesStock();
      saveCampaignPrizesStock(fallback);
      return fallback;
    }

    const sanitized = parsed
      .map((entry) => sanitizePrize(entry))
      .filter((entry): entry is CampaignPrizeStock => entry !== null);

    const merged = buildMergedPrizesStock(sanitized);
    saveCampaignPrizesStock(merged);

    return merged;
  } catch {
    const fallback = cloneInitialCampaignPrizesStock();
    saveCampaignPrizesStock(fallback);
    return fallback;
  }
}

export function saveCampaignPrizesStock(prizes: CampaignPrizeStock[]) {
  writeStorageItem(CAMPAIGN_PRIZES_STOCK_STORAGE_KEY, JSON.stringify(prizes));
}

export function loadCampaignActiveCpf() {
  const raw = readStorageItem(CAMPAIGN_ACTIVE_CPF_STORAGE_KEY);

  if (!raw) return null;

  const normalized = raw.replace(/\D/g, "").slice(0, 11);
  return normalized.length === 11 ? normalized : null;
}

export function saveCampaignActiveCpf(cpf: string) {
  const normalized = cpf.replace(/\D/g, "").slice(0, 11);
  if (normalized.length !== 11) return;
  writeStorageItem(CAMPAIGN_ACTIVE_CPF_STORAGE_KEY, normalized);
}
