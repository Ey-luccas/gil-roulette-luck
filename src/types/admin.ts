export type AdminSession = {
  authenticated: boolean;
  adminUserId: string;
  username: string;
  expiresAt?: string;
};

export type PieceFormInput = {
  name: string;
  originalPrice: number;
  imageUrl?: string;
  active: boolean;
};

export type AdminDashboardMetrics = {
  totalItems: number;
  activeItems: number;
  totalParticipants: number;
  totalSpins: number;
  soldSpins: number;
};

export type AdminItemListRow = {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
  isActive: boolean;
  createdAt: string;
};

export type AdminCustomerSpin = {
  id: string;
  attemptNumber: number;
  prizeId: string;
  prizeName: string;
  prizeNote: string;
  createdAt: string;
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  spinAttempts: number;
  remainingAttempts: number;
  maxAttempts: number;
  whatsappClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
  spins: AdminCustomerSpin[];
};
