import { motion } from 'framer-motion';
import { 
  DollarSign, 
  FolderKanban, 
  TrendingUp, 
  Clock, 
  Users, 
  Wallet,
  Plus,
  ArrowRight,
  Target
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function Dashboard() {
  const { metrics, flowCards, team, setActiveModule } = useAxion();

  // Próximas entregas baseadas nos flowCards com deadline
  const upcomingDeadlines = flowCards
    .filter(card => card.status !== 'concluido' && card.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const topPerformers = [...team]
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-muted-foreground">Acompanhe os indicadores da sua operação</p>
        </div>
        <Button 
          onClick={() => setActiveModule('fluxo')}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Card
        </Button>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Faturamento Mensal"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={DollarSign}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <MetricCard
          title="Projetos Ativos"
          value={metrics.activeProjects}
          icon={FolderKanban}
          variant="default"
          delay={0.1}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(metrics.netProfit)}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 8, isPositive: true }}
          delay={0.2}
        />
        <MetricCard
          title="A Receber"
          value={formatCurrency(metrics.receivables)}
          icon={Clock}
          variant="warning"
          delay={0.3}
        />
        <MetricCard
          title="ROI de Tráfego"
          value={`${metrics.trafficROI.toFixed(1)}%`}
          icon={Target}
          variant={metrics.trafficROI >= 0 ? "success" : "danger"}
          trend={{ value: Math.abs(metrics.trafficROI), isPositive: metrics.trafficROI >= 0 }}
          delay={0.4}
        />
        <MetricCard
          title="Custo Operacional"
          value={formatCurrency(metrics.operationalCost)}
          icon={Wallet}
          variant="danger"
          delay={0.5}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Próximas Entregas</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary gap-1"
              onClick={() => setActiveModule('fluxo')}
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum deadline próximo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((card) => {
                const daysLeft = differenceInDays(parseISO(card.deadline!), new Date());
                const isUrgent = daysLeft <= 3;
                const isOverdue = daysLeft < 0;
                
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{card.clientName}</p>
                      <p className="text-sm text-muted-foreground">{card.attendantName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${isOverdue ? 'danger' : isUrgent ? 'warning' : 'info'}`}>
                        {isOverdue 
                          ? `${Math.abs(daysLeft)}d atrasado` 
                          : daysLeft === 0 
                            ? 'Hoje' 
                            : `${daysLeft}d restantes`
                        }
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(card.deadline!), 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Team Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Ranking da Equipe</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary gap-1"
              onClick={() => setActiveModule('team')}
            >
              Ver equipe
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {topPerformers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum membro cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    {index < 3 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-400 text-orange-900'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{member.performance}%</p>
                    <p className="text-xs text-muted-foreground">performance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
