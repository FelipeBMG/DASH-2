import { 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText,
  Tag
} from 'lucide-react';
import type { Project } from '@/types/axion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProjectDetailsProps {
  project: Project;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const statusLabels: Record<string, { label: string; class: string }> = {
  backlog: { label: 'Backlog', class: 'bg-muted text-muted-foreground' },
  production: { label: 'Em Produção', class: 'bg-info/20 text-info' },
  review: { label: 'Revisão Cliente', class: 'bg-warning/20 text-warning' },
  completed: { label: 'Concluído', class: 'bg-success/20 text-success' },
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const paymentProgress = project.totalValue > 0 
    ? (project.paidValue / project.totalValue) * 100 
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-foreground">{project.title}</h2>
          <span className={cn("status-badge", statusLabels[project.status].class)}>
            {statusLabels[project.status].label}
          </span>
        </div>
        <p className="text-muted-foreground">
          Criado em {format(parseISO(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm">Cliente</span>
          </div>
          <p className="font-medium text-foreground">{project.client}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm">Responsável</span>
          </div>
          <p className="font-medium text-foreground">{project.responsible}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Deadline</span>
          </div>
          <p className="font-medium text-foreground">
            {project.deadline 
              ? format(parseISO(project.deadline), 'dd/MM/yyyy', { locale: ptBR })
              : 'Não definido'
            }
          </p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Tag className="w-4 h-4" />
            <span className="text-sm">Tipo de Cobrança</span>
          </div>
          <p className="font-medium text-foreground">
            {project.billingType === 'single' ? 'Pagamento Único' : 'Fee Mensal'}
          </p>
        </div>
      </div>

      {/* Financial */}
      <div className="p-4 rounded-lg bg-secondary/50 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium">Financeiro</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(project.totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Pago</p>
            <p className="text-xl font-bold text-success">{formatCurrency(project.paidValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">A Receber</p>
            <p className="text-xl font-bold text-warning">{formatCurrency(project.totalValue - project.paidValue)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progresso do Pagamento</span>
            <span>{Math.round(paymentProgress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Briefing */}
      {project.briefing && (
        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Briefing</span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{project.briefing}</p>
        </div>
      )}
    </div>
  );
}
