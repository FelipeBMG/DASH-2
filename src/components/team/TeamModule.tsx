import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollaboratorsAdmin } from "@/hooks/useCollaboratorsAdmin";
import { useSellerRankingLast30Days } from "@/hooks/useSellerRanking";
import { AdminCollaboratorsTab } from "@/components/settings/AdminCollaboratorsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function TeamModule() {
  const { data: collaborators = [], isLoading } = useCollaboratorsAdmin();
  const { entries: rankingEntries } = useSellerRankingLast30Days();

  const totalCost = collaborators.reduce((sum, c) => sum + (Number(c.commissionFixed) || 0), 0);

  const maxDealsWon = rankingEntries.reduce((m, e) => Math.max(m, e.dealsWon), 0);
  const maxFinalizedRevenue = rankingEntries.reduce((m, e) => Math.max(m, e.revenue), 0);

  const performancePercent = (entry: (typeof rankingEntries)[number]) => {
    const dealsFactor = maxDealsWon > 0 ? entry.dealsWon / maxDealsWon : 0;
    const revenueFactor = maxFinalizedRevenue > 0 ? entry.revenue / maxFinalizedRevenue : 0;
    // Peso maior no valor finalizado, mas considerando também volume.
    const score = dealsFactor * 0.4 + revenueFactor * 0.6;
    return Math.max(0, Math.min(100, Math.round(score * 100)));
  };

  const commissionPaid = (entry: (typeof rankingEntries)[number]) => {
    const collaborator = collaborators.find((c) => c.user_id === entry.id);
    const percent = Number(collaborator?.commissionPercent ?? 0);
    const fixed = Number(collaborator?.commissionFixed ?? 0);
    // Comissão do período (30d): valor finalizado * % + fixo.
    const variable = (Number(entry.revenue) || 0) * (percent / 100);
    return {
      total: variable + fixed,
      percent,
      fixed,
      variable,
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-muted-foreground">
            {collaborators.length} colaboradores • Custo total: {formatCurrency(totalCost)}/mês
          </p>
        </div>
      </div>

      <Tabs defaultValue="colaboradores" className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-start">
          <TabsList className="rounded-full bg-secondary/20 border border-border/60 p-1">
            <TabsTrigger value="colaboradores" className="rounded-full px-4">
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-full px-4">
              Ranking
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="colaboradores" className="mt-6 flex-1 min-h-0">
          <AdminCollaboratorsTab />
        </TabsContent>

        <TabsContent value="ranking" className="mt-6 flex-1 min-h-0">
          {/* Ranking Grid */}
          <div className="h-full flex flex-col gap-3 overflow-auto">
            <AnimatePresence mode="popLayout">
              {rankingEntries.slice(0, 9).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card-hover p-5 relative w-full max-w-3xl mx-auto"
                >
                  {/* Ranking Badge */}
                  {index < 3 && (
                    <div
                      className={cn(
                        "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center",
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : index === 1
                            ? "bg-gray-300/20 text-gray-300"
                            : "bg-orange-400/20 text-orange-400",
                      )}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary-foreground">{entry.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{entry.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.dealsWon} fechamentos • {formatCurrency(entry.revenue)} finalizado</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{collaborators.find((c) => c.user_id === entry.id)?.email ?? "—"}</span>
                  </div>

                  {/* Performance */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Performance</span>
                      <span className="font-medium text-foreground">{performancePercent(entry)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performancePercent(entry)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn("h-full rounded-full", "bg-success")}
                      />
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Comissão paga (30d)</p>
                      <p className="font-semibold text-foreground">{formatCurrency(commissionPaid(entry).total)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCurrency(commissionPaid(entry).variable)} variável + {formatCurrency(commissionPaid(entry).fixed)} fixo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Comissão</p>
                      <p className="font-semibold text-foreground">
                        {(commissionPaid(entry).percent ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!isLoading && collaborators.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum colaborador cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
