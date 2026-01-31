export type SellerEntry = {
  id: string;
  name: string;
  username: string; // login
  role: "vendedor" | "producao" | "admin";
  commissionPercent?: number | null;
  commissionFixed?: number | null;
};
