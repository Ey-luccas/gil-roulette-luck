export type SpinItem = {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
};

export type SpinFrame = {
  slot: number;
  token: number;
  item: SpinItem;
};

export type SpinPhase =
  | "idle"
  | "preparing"
  | "selecting"
  | "slowing"
  | "revealed"
  | "saving"
  | "saved"
  | "error";
