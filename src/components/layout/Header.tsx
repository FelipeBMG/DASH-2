import { motion } from 'framer-motion';
import { Bell, Search, Calendar } from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard Executivo',
  projects: 'Gestão de Projetos',
  crm: 'CRM & Pipeline de Vendas',
  financial: 'Financeiro & Controle de Caixa',
  reports: 'Relatórios & Exportações',
  calendar: 'Calendário Operacional',
  team: 'Gestão de Equipe',
  contracts: 'Contratos & Documentos',
  settings: 'Configurações do Sistema',
};

export function Header() {
  const { activeModule, dateRange, setDateRange } = useAxion();
  const [startDate, setStartDate] = useState<Date | undefined>(
    dateRange.start ? new Date(dateRange.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    dateRange.end ? new Date(dateRange.end) : undefined
  );

  const handleDateSelect = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
      if (date) {
        setDateRange({
          ...dateRange,
          start: date.toISOString().split('T')[0],
        });
      }
    } else {
      setEndDate(date);
      if (date) {
        setDateRange({
          ...dateRange,
          end: date.toISOString().split('T')[0],
        });
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {moduleTitles[activeModule]}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-64 pl-9 bg-secondary border-border"
            />
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm hover:bg-transparent">
                  {startDate ? format(startDate, 'dd/MM', { locale: ptBR }) : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateSelect('start', date)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm hover:bg-transparent">
                  {endDate ? format(endDate, 'dd/MM', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateSelect('end', date)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
