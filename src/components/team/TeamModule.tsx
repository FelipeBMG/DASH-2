import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollaboratorsAdmin } from "@/hooks/useCollaboratorsAdmin";
import { useSellerRankingLast30Days } from "@/hooks/useSellerRanking";
import { AdminCollaboratorsTab } from "@/components/settings/AdminCollaboratorsTab";

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
        <div className="text-xs text-muted-foreground text-right max-w-xs">
          Gestão de usuários e colaboradores agora é feita diretamente aqui em Equipe.
        </div>
      </div>

      {/* Team Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
        <AnimatePresence mode="popLayout">
          {rankingEntries.slice(0, 9).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card-hover p-5 relative"
            >
              {/* Ranking Badge */}
              {index < 3 && (
                <div className={cn(
                  "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center",
                  index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  index === 1 ? "bg-gray-300/20 text-gray-300" :
                  "bg-orange-400/20 text-orange-400"
                )}>
                  <Trophy className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-foreground">
                    {entry.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground truncate">{entry.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.dealsWon} fechamentos nos últimos 30 dias
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                <span className="truncate">
                  {collaborators.find((c) => c.user_id === entry.id)?.email ?? "—"}
                </span>
              </div>

              {/* Performance */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium text-foreground">{entry.revenue === 0 ? "0%" : "100%"}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: entry.revenue === 0 ? "0%" : "100%" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      "h-full rounded-full",
                      "bg-success"
                    )}
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Custo Fixo</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(
                      Number(
                        collaborators.find((c) => c.user_id === entry.id)?.commissionFixed ?? 0,
                      ),
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="font-semibold text-foreground">
                    {(collaborators.find((c) => c.user_id === entry.id)?.commissionPercent ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && collaborators.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum colaborador cadastrado</p>
          </div>
        )}
      </div>

      {/* Gestão detalhada de usuários/colaboradores */}
      <div className="mt-8">
        <AdminCollaboratorsTab />
      </div>
    </div>
  );
}
