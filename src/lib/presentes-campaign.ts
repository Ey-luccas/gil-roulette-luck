import { MAX_SPIN_ATTEMPTS_PER_CPF } from "@/lib/campaign-rules";

export const PRESENTES_CAMPAIGN_NAME = "Presentes do 5.5";

export const CAMPAIGN_PARTICIPANTS_STORAGE_KEY = "campaign_participants";
export const CAMPAIGN_PRIZES_STOCK_STORAGE_KEY = "campaign_prizes_stock";
export const CAMPAIGN_ACTIVE_CPF_STORAGE_KEY = "campaign_active_cpf";

export type CampaignParticipantSpin = {
  prize: string;
  prizeId: string;
  note: string;
  date: string;
};

export type CampaignParticipant = {
  name: string;
  phone: string;
  cpf: string;
  spins: CampaignParticipantSpin[];
};

export type CampaignPrizeStock = {
  id: string;
  name: string;
  quantity: number | null;
  note: string;
};

export const INITIAL_CAMPAIGN_PRIZES_STOCK: CampaignPrizeStock[] = [
  { id: "brinde-surpresa", name: "Brinde surpresa", quantity: 10, note: "" },
  { id: "presente-surpresa", name: "Presente surpresa", quantity: 0, note: "" },
  {
    id: "voucher-15",
    name: "Voucher de R$ 15 na próxima compra",
    quantity: 12,
    note: "Válido por 24h",
  },
  {
    id: "cupom-10",
    name: "Cupom de 10% de desconto",
    quantity: 10,
    note: "Válido somente no dia",
  },
  { id: "tente-novamente", name: "Tente novamente", quantity: null, note: "" },
  {
    id: "quase-la",
    name: "Quase lá… condição facilitada de pagamento",
    quantity: 15,
    note: "",
  },
];

export function cloneInitialCampaignPrizesStock() {
  return INITIAL_CAMPAIGN_PRIZES_STOCK.map((prize) => ({ ...prize }));
}

export function getRemainingSpinsForCpf(spinsUsed: number) {
  return Math.max(MAX_SPIN_ATTEMPTS_PER_CPF - spinsUsed, 0);
}
