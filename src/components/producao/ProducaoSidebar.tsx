import { FolderKanban, List, CalendarDays, Settings, Workflow } from "lucide-react";
import type { ProducaoSection } from "@/components/producao/types";
import { cn } from "@/lib/utils";

type Props = {
  activeSection: ProducaoSection;
  onChangeSection: (section: ProducaoSection) => void;
};

const items: Array<{ id: ProducaoSection; label: string; icon: typeof FolderKanban }> = [
  { id: "fluxo", label: "Fluxo", icon: Workflow },
  { id: "kanban", label: "Kanban", icon: FolderKanban },
  { id: "lista", label: "Lista", icon: List },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function ProducaoSidebar({ activeSection, onChangeSection }: Props) {
  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-border bg-background/60 p-4 md:flex">
      <div className="mb-3 text-sm font-semibold text-foreground">Produção</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeSection(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
