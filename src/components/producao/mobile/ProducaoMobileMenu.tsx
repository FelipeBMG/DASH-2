import { CalendarDays, Settings, ShoppingCart, Workflow, FolderKanban, List } from "lucide-react";

import type { ProducaoSection } from "@/components/producao/types";
import { BrandMark } from "@/components/common/BrandMark";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";

const items: Array<{ id: ProducaoSection; label: string; icon: typeof Workflow }> = [
  { id: "fluxo", label: "Fluxo", icon: Workflow },
  { id: "sales", label: "Vendas", icon: ShoppingCart },
  { id: "kanban", label: "Kanban", icon: FolderKanban },
  { id: "lista", label: "Projetos", icon: List },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
  { id: "settings", label: "Configurações", icon: Settings },
];

type Props = {
  activeSection: ProducaoSection;
  onChangeSection: (section: ProducaoSection) => void;
};

export function ProducaoMobileMenu({ activeSection, onChangeSection }: Props) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-4">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <SheetClose asChild key={item.id}>
              <button
                type="button"
                onClick={() => onChangeSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            </SheetClose>
          );
        })}
      </nav>
    </div>
  );
}
