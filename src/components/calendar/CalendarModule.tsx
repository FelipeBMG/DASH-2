import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  FolderKanban
} from 'lucide-react';
import { useAxion } from '@/contexts/AxionContext';
import { Button } from '@/components/ui/button';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  addMonths, 
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarModule() {
  const { projects, events } = useAxion();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning of the month
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  // Get deadlines from projects
  const deadlines = useMemo(() => {
    return projects
      .filter(p => p.deadline && p.status !== 'completed')
      .map(p => ({
        id: p.id,
        title: p.title,
        date: parseISO(p.deadline),
        type: 'deadline' as const,
      }));
  }, [projects]);

  const getEventsForDay = (date: Date) => {
    return deadlines.filter(d => isSameDay(d.date, date));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">Visualize deadlines e eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass-card p-3"
      >
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div 
              key={day} 
              className="text-center text-[10px] font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}
          
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "aspect-square p-1 rounded-md border transition-all cursor-pointer",
                  isToday(day) 
                    ? "bg-primary/20 border-primary" 
                    : "border-border hover:border-primary/50 hover:bg-secondary/50",
                  !isSameMonth(day, currentDate) && "opacity-30"
                )}
              >
                <div className="flex flex-col h-full">
                  <span className={cn(
                    "text-[10px] font-medium",
                    isToday(day) ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasEvents && (
                    <div className="flex-1 mt-1 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-1 px-1 py-0.5 rounded bg-warning/20 text-warning text-[8px] truncate"
                        >
                          <FolderKanban className="w-2 h-2 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayEvents.length - 2} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Deadline</span>
        </div>
      </div>
    </div>
  );
}
