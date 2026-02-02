import { motion } from "framer-motion";
import { Medal, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VendedorRankingEntry } from "@/components/vendedor/types";

type Props = {
  entries: VendedorRankingEntry[];
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function VendedorRankingCard({ entries }: Props) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
      aria-label="Ranking de vendedores"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Top 5 Vendedores</h2>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {entries.slice(0, 5).map((e, idx) => {
          const position = idx + 1;
          const isMe = Boolean(e.isCurrentUser);

          return (
            <div
              key={e.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3",
                isMe && "border-primary/30 bg-primary/10",
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center",
                  position === 1 ? "bg-warning/20 text-warning" : "bg-muted text-foreground",
                )}
                aria-label={`Posição ${position}`}
              >
                {position === 1 ? <Medal className="w-4 h-4" /> : <span className="text-sm font-semibold">{position}</span>}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {e.dealsWon} fechamentos • {formatBRL(e.revenue)}
                </p>
              </div>

              {isMe ? (
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary/15 text-primary">
                  você
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}
