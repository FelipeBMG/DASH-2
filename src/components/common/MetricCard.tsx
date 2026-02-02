import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantStyles = {
  default: 'from-muted/50 to-muted/30',
  primary: 'from-primary/20 to-primary/5',
  success: 'from-success/20 to-success/5',
  warning: 'from-warning/20 to-warning/5',
  danger: 'from-destructive/20 to-destructive/5',
};

const iconStyles = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-destructive/20 text-destructive',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="metric-card group"
    >
      <div className={cn(
        "absolute inset-0 opacity-50 bg-gradient-to-br rounded-xl transition-opacity group-hover:opacity-70",
        variantStyles[variant]
      )} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            iconStyles[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend.isPositive 
                ? "bg-success/20 text-success" 
                : "bg-destructive/20 text-destructive"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p
            className="text-xl font-bold text-foreground leading-tight text-left tabular-nums overflow-hidden text-ellipsis whitespace-nowrap md:text-2xl"
            title={String(value)}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
