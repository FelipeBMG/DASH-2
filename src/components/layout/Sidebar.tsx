import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  UserCog, 
  FileText, 
  Settings,
  ShoppingCart,
  ChevronLeft,
  Megaphone,
  Workflow
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import type { ModuleName } from '@/types/axion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/common/BrandMark';

const menuItems: { id: ModuleName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fluxo', label: 'Fluxo de Operações', icon: Workflow },
  { id: 'traffic', label: 'Tráfego', icon: Megaphone },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'team', label: 'Equipe', icon: UserCog },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

function roleLabel(role: unknown): string {
  // AxionContext (legado): admin | manager | member
  if (role === "admin") return "Administrador";
  if (role === "manager") return "Gestor";
  if (role === "member") return "Colaborador";

  // AuthContext (novo): admin | seller | production
  if (role === "seller") return "Vendedor";
  if (role === "production") return "Produção";

  return "Usuário";
}

export function Sidebar() {
  const { activeModule, setActiveModule, currentUser } = useAxion();
  const [collapsed, setCollapsed] = useState(false);

  const userName = (currentUser?.name ?? "").trim();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "hidden md:flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BrandMark
              collapsed={collapsed}
              title={roleLabel(currentUser.role)}
              subtitle={userName}
            />
          </motion.div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveModule(item.id)}
              className={cn(
                "w-full sidebar-item",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50",
          collapsed && "justify-center"
        )}>
          {!collapsed && (
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
          )}
        </div>
      </div>
    </motion.aside>
  );
}
