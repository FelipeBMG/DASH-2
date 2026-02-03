import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Calendar, Settings, Headset, Workflow, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VendedorSection } from "@/components/vendedor/types";
import { BrandMark } from "@/components/common/BrandMark";

const items: { id: VendedorSection; label: string; icon: typeof Headset }[] = [
  { id: "atendimento", label: "Atendimento", icon: Headset },
  { id: "fluxo", label: "Fluxo de Operações", icon: Workflow },
  { id: "sales", label: "Vendas", icon: ShoppingCart },
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "settings", label: "Configurações", icon: Settings },
];

type Props = {
  activeSection: VendedorSection;
  onChangeSection: (section: VendedorSection) => void;
};

export function VendedorSidebar({ activeSection, onChangeSection }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "hidden md:flex h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BrandMark collapsed={collapsed} />
          </motion.div>
        </div>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChangeSection(item.id)}
              className={cn("w-full sidebar-item", isActive && "active")}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
              {isActive && !collapsed ? (
                <motion.div layoutId="activeIndicatorSeller" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              ) : null}
            </motion.button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">V</span>
          </div>
          {!collapsed ? (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">vendedor</p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.aside>
  );
}
