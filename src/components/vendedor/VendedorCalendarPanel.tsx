import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarClock, PhoneForwarded, Truck, Users } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VendedorRankingCard } from "@/components/vendedor/VendedorRankingCard";
import type { VendedorAppointment } from "@/components/vendedor/types";
import { useSellerRankingLast30Days } from "@/hooks/useSellerRanking";
import { useFlowCards } from "@/hooks/useFlowCards";
import { useQuery } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function badgeStyle(type: "followup" | "meeting" | "delivery") {
  switch (type) {
    case "followup":
      return { className: "bg-primary/15 text-primary", icon: PhoneForwarded };
    case "meeting":
      return { className: "bg-warning/15 text-warning", icon: Users };
    case "delivery":
      return { className: "bg-success/15 text-success", icon: Truck };
    default:
      return { className: "bg-muted text-foreground", icon: CalendarClock };
  }
}

export function VendedorCalendarPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const { entries: rankingEntries } = useSellerRankingLast30Days();
  const { data: flowCards = [] } = useFlowCards();

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendar-events", format(monthStart, "yyyy-MM")],
    enabled: Boolean(isSupabaseConfigured),
    queryFn: async () => {
      const supabase = getSupabase();
      const startISO = monthStart.toISOString();
      const endISO = monthEnd.toISOString();
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id,title,start_at")
        .gte("start_at", startISO)
        .lte("start_at", endISO)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; start_at: string }>;
    },
  });

  const appointments = useMemo<VendedorAppointment[]>(() => {
    const fromDb: VendedorAppointment[] = calendarEvents.map((e) => ({
      id: `cal:${e.id}`,
      title: e.title,
      date: e.start_at.split("T")[0],
      type: "meeting",
    }));

    const fromDeadlines: VendedorAppointment[] = flowCards
      .filter((c) => Boolean(c.deadline))
      .filter((c) => isSameMonth(parseISO(c.deadline as string), currentDate))
      .map((c) => ({
        id: `dl:${c.id}`,
        title: `Prazo: ${c.clientName}`,
        date: c.deadline as string,
        type: "delivery" as const,
      }));

    return [...fromDb, ...fromDeadlines];
  }, [calendarEvents, flowCards, currentDate]);

  const eventsForDay = useMemo(() => {
    return (date: Date) => appointments.filter((e) => isSameDay(parseISO(e.date), date));
  }, [appointments]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground capitalize">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h2>
            <p className="text-muted-foreground">Agendamentos e prazos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => subMonths(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => addMonths(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="aspect-square" />
            ))}

            {daysInMonth.map((day) => {
              const dayEvents = eventsForDay(day);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square p-2 rounded-lg border transition-all cursor-pointer",
                    isToday(day) ? "bg-primary/20 border-primary" : "border-border hover:border-primary/50 hover:bg-secondary/50",
                    !isSameMonth(day, currentDate) && "opacity-30",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <span className={cn("text-sm font-medium", isToday(day) ? "text-primary" : "text-foreground")}>
                      {format(day, "d")}
                    </span>

                    {hasEvents ? (
                      <div className="flex-1 mt-1 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => {
                          const { className, icon: Icon } = badgeStyle(event.type);
                          return (
                            <div
                              key={event.id}
                              className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate", className)}
                            >
                              <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 ? (
                          <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} mais</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <span className="text-sm text-muted-foreground">Follow-up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Reunião</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Prazo</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <VendedorRankingCard entries={rankingEntries} />
      </div>
    </div>
  );
}
