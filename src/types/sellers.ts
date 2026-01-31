export type SellerEntry = {
  id: string;
  name: string;
  username: string; // login
  role: "vendedor" | "admin";
  commissionPercent?: number | null;
  commissionFixed?: number | null;
};
