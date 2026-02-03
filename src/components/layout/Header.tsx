import { motion } from "framer-motion";
import { Bell, Calendar } from "lucide-react";
import { useAxion } from "@/contexts/AxionContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DateRange as DayPickerRange } from "react-day-picker";

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

type Props = {
  leftSlot?: ReactNode;
};

export function Header({ leftSlot }: Props) {
  const { activeModule, dateRange, setDateRange } = useAxion();

  const toISO = (d: Date) => d.toISOString().split("T")[0];
  const today = useMemo(() => new Date(), []);
  const thisMonthStart = useMemo(() => startOfMonth(today), [today]);

  const [rangeDraft, setRangeDraft] = useState<DayPickerRange | undefined>(() => {
    const from = dateRange.start ? new Date(dateRange.start) : undefined;
    const to = dateRange.end ? new Date(dateRange.end) : undefined;
    return from || to ? { from, to } : undefined;
  });

  const rangeLabel = useMemo(() => {
    const from = dateRange.start ? new Date(dateRange.start) : undefined;
    const to = dateRange.end ? new Date(dateRange.end) : undefined;
    if (!from && !to) return "Selecionar";
    if (from && !to) return format(from, "dd/MM/yyyy", { locale: ptBR });
    if (from && to)
      return `${format(from, "dd/MM/yyyy", { locale: ptBR })} — ${format(to, "dd/MM/yyyy", { locale: ptBR })}`;
    return "Selecionar";
  }, [dateRange.end, dateRange.start]);

  const presets = useMemo(
    () => {
      const startThisMonth = toISO(thisMonthStart);
      const endToday = toISO(today);
      const startToday = toISO(today);

      const last7Start = toISO(addDays(today, -6));
      const last15Start = toISO(addDays(today, -14));

      const prevMonthStartDate = startOfMonth(subMonths(today, 1));
      const prevMonthEndDate = endOfMonth(subMonths(today, 1));

      return [
        { id: "today", label: "Hoje", range: { start: startToday, end: startToday } },
        { id: "last7", label: "Últimos 7 dias", range: { start: last7Start, end: endToday } },
        { id: "last15", label: "Últimos 15 dias", range: { start: last15Start, end: endToday } },
        { id: "thisMonth", label: "Este mês", range: { start: startThisMonth, end: endToday } },
        {
          id: "prevMonth",
          label: "Mês anterior",
          range: { start: toISO(prevMonthStartDate), end: toISO(prevMonthEndDate) },
        },
        { id: "all", label: "Todo o período", range: { start: "1970-01-01", end: "9999-12-31" } },
      ] as const;
    },
    [thisMonthStart, today],
  );

  const activePresetLabel = useMemo(() => {
    const p = presets.find((x) => x.range.start === dateRange.start && x.range.end === dateRange.end);
    return p?.label ?? "Personalizado";
  }, [dateRange.end, dateRange.start, presets]);

  const [lastRangeSetter, setLastRangeSetter] = useState<"quick" | "filter">("filter");

  const applyRange = (next: { start: string; end: string }) => {
    setLastRangeSetter("filter");
    setDateRange(next);
    setRangeDraft({ from: new Date(next.start), to: new Date(next.end) });
  };

  const handleRangeSelect = (next: DayPickerRange | undefined, source: "quick" | "filter") => {
    setLastRangeSetter(source);
    setRangeDraft(next);
    if (!next?.from) return;
    // Se o usuário selecionou só o início, tratamos como “um dia” e já atualizamos o filtro.
    const start = toISO(next.from);
    const end = next.to ? toISO(next.to) : start;
    setDateRange({ start, end });
  };

  const dataRangeFilterLabel = useMemo(() => {
    // Preset sempre mostra o nome do preset.
    if (activePresetLabel !== "Personalizado") return activePresetLabel;
    // Se a seleção custom veio do range "Buscar", no bloco Data Range Filter mostramos só “Personalizado”.
    if (lastRangeSetter === "quick") return "Personalizado";
    // Se a seleção custom foi feita no próprio bloco, mostramos o intervalo.
    return rangeLabel;
  }, [activePresetLabel, lastRangeSetter, rangeLabel]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40"
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-3 min-w-0">
          {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}
          <h1 className="text-xl font-semibold text-foreground">
            {moduleTitles[activeModule]}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Range quick access (replaces search) */}
          <div className="hidden md:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10 px-3 gap-2 justify-start text-left"
                >
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-[260px]">{rangeLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={rangeDraft}
                  onSelect={(next) => handleRangeSelect(next, "quick")}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Range Filter (restored) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />

            {/* Presets */}
            <div className="hidden sm:flex items-center gap-1">
              {presets.map((p) => (
                <Button
                  key={p.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto px-2 py-0.5 text-xs hover:bg-transparent",
                    activePresetLabel === p.label ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => applyRange({ start: p.range.start, end: p.range.end })}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Range picker (custom) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm hover:bg-transparent">
                  {dataRangeFilterLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={rangeDraft}
                  onSelect={(next) => handleRangeSelect(next, "filter")}
                  numberOfMonths={2}
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
