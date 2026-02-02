import { motion } from "framer-motion";
import {
  DollarSign,
  FolderKanban,
  TrendingUp,
  Clock,
  Users,
  Wallet,
  Megaphone,
  Plus,
  ArrowRight,
  Target,
  Percent,
} from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxion } from "@/contexts/AxionContext";
import { useFlowCards } from "@/hooks/useFlowCards";
import { useSellerRankingLast30Days } from "@/hooks/useSellerRanking";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function Dashboard() {
  const { setActiveModule, dateRange } = useAxion();
  const { data: flowCards = [] } = useFlowCards();
  const { entries: rankingEntries } = useSellerRankingLast30Days();

  const kpis = useDashboardKpis(dateRange);
  const taxAmount = kpis.revenue * (kpis.taxRate / 100);

  const upcomingDeadlines = flowCards
    .filter((card) => card.status !== "concluido" && card.deadline)
    .sort((a, b) => new Date(a.deadline || "").getTime() - new Date(b.deadline || "").getTime())
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        <MetricCard
          title="Faturamento Mensal"
          value={formatCurrency(kpis.revenue)}
          icon={DollarSign}
          variant="primary"
          delay={0}
        />
        <MetricCard
          title="Projetos Ativos"
          value={kpis.activeProjects}
          icon={FolderKanban}
          variant="default"
          delay={0.1}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(kpis.netProfit)}
          icon={TrendingUp}
          variant="success"
          delay={0.2}
        />
        <MetricCard
          title="A Receber"
          value={formatCurrency(kpis.receivables)}
          icon={Clock}
          variant="warning"
          delay={0.3}
        />
        <MetricCard
          title="ROI de Tráfego"
          value={`${kpis.trafficROI.toFixed(1)}%`}
          icon={Target}
          variant={kpis.trafficROI >= 0 ? "success" : "danger"}
          trend={{ value: Math.abs(Number(kpis.trafficROI.toFixed(1))), isPositive: kpis.trafficROI >= 0 }}
          delay={0.4}
        />
        <MetricCard
          title="Gasto em Tráfego"
          value={formatCurrency(kpis.trafficCosts)}
          icon={Megaphone}
          variant="warning"
          delay={0.5}
        />
        <MetricCard
          title="Custo Operacional"
          value={formatCurrency(kpis.operationalCost)}
          icon={Wallet}
          variant="danger"
          delay={0.6}
        />
      </div>

      {/* Tax highlight (separado da linha de cards) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-5"
        aria-label="Resumo de imposto"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Imposto</h3>
              <p className="text-sm text-muted-foreground">
                Estimativa no período ({kpis.taxRate}% sobre o faturamento)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(taxAmount)}</p>
            <p className="text-xs text-muted-foreground">valor destinado a imposto</p>
          </div>
        </div>
      </motion.section>

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

          {rankingEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum membro cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankingEntries.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {entry.name.charAt(0)}
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
                    <p className="font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.dealsWon} fechamentos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(entry.revenue)}</p>
                    <p className="text-xs text-muted-foreground">faturamento 30d</p>
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
