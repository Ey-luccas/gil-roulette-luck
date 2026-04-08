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

export type AdminCustomerLatestItem = {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
  isActive: boolean;
};

export type AdminCustomerLatestSpin = {
  id: string;
  attemptNumber: number;
  finalPrice: number;
  originalTotal: number;
  discountAmount: number;
  discountPercent: number;
  createdAt: string;
  isSold: boolean;
  soldAt: string | null;
  items: AdminCustomerLatestItem[];
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  spinAttempts: number;
  createdAt: string;
  latestSpin: AdminCustomerLatestSpin | null;
};
