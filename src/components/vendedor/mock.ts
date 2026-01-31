import type { VendedorAppointment, VendedorAtendimento, VendedorRankingEntry } from "@/components/vendedor/types";

export const vendedorMockRanking: VendedorRankingEntry[] = [
  { id: "v1", name: "Ana", dealsWon: 12, revenue: 74200 },
  { id: "v2", name: "Bruno", dealsWon: 10, revenue: 68900 },
  { id: "v3", name: "Carla", dealsWon: 9, revenue: 61200 },
  { id: "v4", name: "Diego", dealsWon: 8, revenue: 57700 },
  { id: "v5", name: "vendedor", dealsWon: 7, revenue: 53400, isCurrentUser: true },
];

export const vendedorMockAtendimentos: VendedorAtendimento[] = [
  {
    id: "a1",
    client: "Loja Horizonte",
    stage: "Qualificação",
    value: 6800,
    nextAction: "Ligar para validar orçamento",
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "a2",
    client: "Clínica Aurora",
    stage: "Proposta",
    value: 12500,
    nextAction: "Enviar proposta revisada",
    dueDate: addDaysISO(1),
  },
  {
    id: "a3",
    client: "Construtora Atlas",
    stage: "Negociação",
    value: 24900,
    nextAction: "Reunião de alinhamento",
    dueDate: addDaysISO(2),
  },
  {
    id: "a4",
    client: "E-commerce Prisma",
    stage: "Novo",
    value: 4200,
    nextAction: "Qualificar lead via WhatsApp",
    dueDate: addDaysISO(3),
  },
];

export const vendedorMockAppointments: VendedorAppointment[] = [
  {
    id: "e1",
    title: "Follow-up: Clínica Aurora",
    date: addDaysISO(1),
    type: "followup",
  },
  {
    id: "e2",
    title: "Reunião: Construtora Atlas",
    date: addDaysISO(2),
    type: "meeting",
  },
  {
    id: "e3",
    title: "Prazo de entrega: Loja Horizonte",
    date: addDaysISO(5),
    type: "delivery",
  },
  {
    id: "e4",
    title: "Follow-up: E-commerce Prisma",
    date: addDaysISO(3),
    type: "followup",
  },
];

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
