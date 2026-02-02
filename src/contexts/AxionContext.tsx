import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { 
  Project, Lead, Client, TeamMember, Transaction, 
  CalendarEvent, Settings, User, DashboardMetrics, ModuleName,
  TrafficEntry, FlowCard
} from '@/types/axion';

interface DateRange {
  start: string;
  end: string;
}

interface AxionContextType {
  // User
  currentUser: User;
  
  // Active module
  activeModule: ModuleName;
  setActiveModule: (module: ModuleName) => void;
  
  // Date filter
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  
  // Data
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  leads: Lead[];
  setLeads: (leads: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  clients: Client[];
  setClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  team: TeamMember[];
  setTeam: (team: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[])) => void;
  trafficEntries: TrafficEntry[];
  setTrafficEntries: (entries: TrafficEntry[] | ((prev: TrafficEntry[]) => TrafficEntry[])) => void;
  flowCards: FlowCard[];
  setFlowCards: (cards: FlowCard[] | ((prev: FlowCard[]) => FlowCard[])) => void;
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  
  // Computed metrics
  metrics: DashboardMetrics;
  
  // Modal state
  isModalOpen: boolean;
  modalContent: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const defaultUser: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@exemplo.com',
  role: 'admin',
};

const defaultSettings: Settings = {
  name: 'Felipe',
  email: 'felipe@email.com',
  phone: '',
  companyName: 'Empresa',
  taxRate: 15,
  currency: 'BRL',
};

const AxionContext = createContext<AxionContextType | null>(null);

export function AxionProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<ModuleName>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const [projects, setProjects] = useLocalStorage<Project[]>('axion_projects', []);
  const [leads, setLeads] = useLocalStorage<Lead[]>('axion_leads', []);
  const [clients, setClients] = useLocalStorage<Client[]>('axion_clients', []);
  const [team, setTeam] = useLocalStorage<TeamMember[]>('axion_team', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('axion_transactions', []);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('axion_events', []);
  const [trafficEntries, setTrafficEntries] = useLocalStorage<TrafficEntry[]>('axion_traffic', []);
  const [flowCards, setFlowCards] = useLocalStorage<FlowCard[]>('axion_flow_cards', []);
  const [settings, setSettings] = useLocalStorage<Settings>('axion_settings', defaultSettings);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  
  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContent(null);
  }, []);
  
  // Compute metrics - consolidating ALL data sources
  const metrics: DashboardMetrics = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // === RECEITAS (Flow Cards em_producao ou concluido) ===
    const flowCardRevenue = flowCards
      .filter(card => 
        (card.status === 'em_producao' || card.status === 'concluido') &&
        new Date(card.updatedAt) >= startOfMonth
      )
      .reduce((sum, card) => sum + card.entryValue, 0);
    
    // Transações de entrada (módulo financeiro)
    const transactionIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.value, 0);
    
    // Valores pagos de projetos no mês (paidValue) - legado
    const projectIncome = projects
      .filter(p => new Date(p.updatedAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.paidValue, 0);
    
    // Faturamento total = flowCards finalizados + transações + projetos legados
    const monthlyRevenue = flowCardRevenue + transactionIncome + projectIncome;
    
    // === DESPESAS ===
    // 1. Transações de despesa (módulo financeiro)
    const transactionExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.value, 0);
    
    // 2. Custos fixos da equipe
    const teamCosts = team.reduce((sum, m) => sum + m.fixedCost, 0);
    
    // 3. Gastos com tráfego (Meta Ads + imposto)
    const trafficCosts = trafficEntries
      .filter(t => new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.totalWithTax, 0);
    
    // Custo operacional total = despesas + equipe + tráfego
    const operationalCost = transactionExpenses + teamCosts + trafficCosts;
    
    // === PROJETOS ATIVOS (Flow Cards não concluídos) ===
    const activeProjectsCount = flowCards.filter(card => card.status !== 'concluido').length + 
                                projects.filter(p => p.status !== 'completed').length;
    
    // === A RECEBER (Cards em aguardando_pagamento + projetos pendentes) ===
    const flowCardReceivables = flowCards
      .filter(card => card.status === 'aguardando_pagamento')
      .reduce((sum, card) => sum + card.entryValue, 0);
    
    const projectReceivables = projects
      .filter(p => p.totalValue > p.paidValue)
      .reduce((sum, p) => sum + (p.totalValue - p.paidValue), 0);
    
    const receivables = flowCardReceivables + projectReceivables;
    
    // === CONVERSÃO (baseado em flow cards) ===
    const totalLeadsFromCards = flowCards.reduce((sum, card) => sum + card.leadsCount, 0);
    const convertedCards = flowCards.filter(card => 
      card.status === 'em_producao' || card.status === 'revisao' || card.status === 'concluido'
    ).length;
    const conversionRate = totalLeadsFromCards > 0 
      ? (convertedCards / totalLeadsFromCards) * 100 
      : leads.length > 0 
        ? (leads.filter(l => l.stage === 'won').length / leads.length) * 100 
        : 0;
    
    // === ROI DE TRÁFEGO ===
    // Total gasto com tráfego (incluindo imposto)
    const totalTrafficSpent = trafficEntries.reduce((sum, t) => sum + t.totalWithTax, 0);
    // Valor finalizado dos cards (em_producao + concluido)
    const totalFlowRevenue = flowCards
      .filter(card => card.status === 'em_producao' || card.status === 'concluido')
      .reduce((sum, card) => sum + card.entryValue, 0);
    // ROI = (Receita - Custo) / Custo * 100
    const trafficROI = totalTrafficSpent > 0 
      ? ((totalFlowRevenue - totalTrafficSpent) / totalTrafficSpent) * 100 
      : 0;
    
    // === LUCRO LÍQUIDO ===
    // Aplica taxa de imposto das configurações sobre a receita
    const taxAmount = monthlyRevenue * (settings.taxRate / 100);
    const netProfit = monthlyRevenue - operationalCost - taxAmount;
    
    return {
      monthlyRevenue,
      activeProjects: activeProjectsCount,
      netProfit,
      receivables,
      conversionRate,
      operationalCost,
      trafficROI,
    };
  }, [transactions, projects, leads, team, trafficEntries, flowCards, settings.taxRate]);
  
  const contextValue: AxionContextType = {
    currentUser: defaultUser,
    activeModule,
    setActiveModule,
    dateRange,
    setDateRange,
    projects,
    setProjects,
    leads,
    setLeads,
    clients,
    setClients,
    team,
    setTeam,
    transactions,
    setTransactions,
    events,
    setEvents,
    trafficEntries,
    setTrafficEntries,
    flowCards,
    setFlowCards,
    settings,
    setSettings,
    metrics,
    isModalOpen,
    modalContent,
    openModal,
    closeModal,
  };
  
  return (
    <AxionContext.Provider value={contextValue}>
      {children}
    </AxionContext.Provider>
  );
}

export function useAxion() {
  const context = useContext(AxionContext);
  if (!context) {
    throw new Error('useAxion must be used within an AxionProvider');
  }
  return context;
}
