import {
  LayoutDashboard,
  DollarSign,
  BarChart3,
  Calendar,
  UserCog,
  FileText,
  Settings,
  ShoppingCart,
  Megaphone,
  Workflow,
} from "lucide-react";

import { useAxion } from "@/contexts/AxionContext";
import type { ModuleName } from "@/types/axion";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/common/BrandMark";
import { SheetClose } from "@/components/ui/sheet";

const menuItems: { id: ModuleName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fluxo", label: "Fluxo de Operações", icon: Workflow },
  { id: "traffic", label: "Tráfego", icon: Megaphone },
  { id: "financial", label: "Financeiro", icon: DollarSign },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "team", label: "Equipe", icon: UserCog },
  { id: "contracts", label: "Contratos", icon: FileText },
  { id: "sales", label: "Vendas", icon: ShoppingCart },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function AdminMobileMenu() {
  const { activeModule, setActiveModule } = useAxion();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-4">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <SheetClose asChild key={item.id}>
              <button
                type="button"
                onClick={() => setActiveModule(item.id)}
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

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Criado por Felipe Gloria</p>
            <a
              href="https://felipegloria.site"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground truncate hover:underline"
            >
              felipegloria.site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
