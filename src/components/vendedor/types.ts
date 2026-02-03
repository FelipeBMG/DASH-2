export type VendedorSection = "atendimento" | "fluxo" | "sales" | "calendar" | "settings";

export type VendedorRankingEntry = {
  id: string;
  name: string;
  dealsWon: number;
  revenue: number;
  isCurrentUser?: boolean;
};

export type VendedorAtendimento = {
  id: string;
  client: string;
  stage: "Novo" | "Qualificação" | "Proposta" | "Negociação" | "Fechado";
  value: number;
  nextAction: string;
  dueDate: string; // ISO date
};

export type VendedorAppointment = {
  id: string;
  title: string;
  date: string; // ISO date
  type: "followup" | "meeting" | "delivery";
};
