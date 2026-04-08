export type CampaignItem = {
  id: string;
  name: string;
  imageUrl?: string;
  originalPrice: number;
  active: boolean;
};

export type ParticipantInput = {
  name: string;
  phone: string;
  cpf: string;
};

export type SpinResult = {
  items: CampaignItem[];
  originalTotal: number;
  finalPrice: number;
  savings: number;
  savingsPercent: number;
};
