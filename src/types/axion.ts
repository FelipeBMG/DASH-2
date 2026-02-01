// AXION ERP Types

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member';
}

export interface Project {
  id: string;
  title: string;
  client: string;
  clientId: string;
  responsible: string;
  responsibleId: string;
  totalValue: number;
  paidValue: number;
  billingType: 'single' | 'monthly' | 'pending';
  deadline: string;
  paymentForecast: string;
  briefing: string;
  status: 'backlog' | 'production' | 'review' | 'completed';
  productQuantity: number;
  attachments: ProjectAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  type: 'audio' | 'image';
  url: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: string;
  stage: 'prospecting' | 'proposal' | 'won' | 'lost';
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: string;
  status: 'active' | 'inactive';
  totalSpent: number;
  projectsCount: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  level: 'junior' | 'mid' | 'senior' | 'lead';
  commission: number;
  fixedCost: number;
  performance: number;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  value: number;
  date: string;
  projectId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'meeting' | 'payment' | 'other';
  projectId?: string;
}

export interface Settings {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  taxRate: number;
  currency: string;
}

export interface DashboardMetrics {
  monthlyRevenue: number;
  activeProjects: number;
  netProfit: number;
  receivables: number;
  conversionRate: number;
  operationalCost: number;
  trafficROI: number;
}

export interface TrafficEntry {
  id: string;
  date: string;
  value: number;
  leads: number;
  conversions: number;
  taxRate: number;
  taxValue: number;
  totalWithTax: number;
  createdAt: string;
}

export type FlowCardStatus = 
  | 'leads'
  | 'negociacao'
  | 'aguardando_pagamento'
  | 'em_producao'
  | 'revisao'
  | 'concluido';

export interface FlowCard {
  id: string;
  date: string;
  clientName: string;
  leadsCount: number;
  quantity: number;
  entryValue: number;
  category?: string;
  status: FlowCardStatus;
  createdById: string;
  createdByName: string;
  attendantId: string;
  attendantName: string;
  productionResponsibleId: string;
  productionResponsibleName: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ModuleName = 
  | 'dashboard'
  | 'fluxo'
  | 'traffic'
  | 'financial'
  | 'reports'
  | 'calendar'
  | 'team'
  | 'contracts'
  | 'settings';
