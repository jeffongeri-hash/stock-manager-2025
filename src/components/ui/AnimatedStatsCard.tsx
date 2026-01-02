
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface AnimatedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'danger' | 'primary' | 'warning';
  delay?: number;
}

export function AnimatedStatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
  sparklineData,
  className,
  valueClassName,
  onClick,
  variant = 'default',
  delay = 0,
}: AnimatedStatsCardProps) {
  const formattedTrend = trend !== undefined ? (trend > 0 ? `+${trend.toFixed(2)}%` : `${trend.toFixed(2)}%`) : null;
  const isTrendPositive = trend !== undefined ? trend > 0 : null;

  const chartData = useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) return [];
    return sparklineData.map((value, index) => ({ value, index }));
  }, [sparklineData]);

  const variantStyles = {
    default: 'bg-card hover:bg-card/80',
    success: 'bg-success/10 hover:bg-success/15 border-success/20',
    danger: 'bg-danger/10 hover:bg-danger/15 border-danger/20',
    primary: 'bg-primary/10 hover:bg-primary/15 border-primary/20',
    warning: 'bg-warning/10 hover:bg-warning/15 border-warning/20',
  };

  const sparklineColor = {
    default: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    danger: 'hsl(var(--danger))',
    primary: 'hsl(var(--primary))',
    warning: 'hsl(var(--warning))',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
        'group cursor-pointer border',
        variantStyles[variant],
        onClick ? 'cursor-pointer' : '',
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards'
      }}
      onClick={onClick}
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>

      {/* Sparkline background */}
      {chartData.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sparkline-${variant}-${delay}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor[variant]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={sparklineColor[variant]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor[variant]}
                fill={`url(#sparkline-${variant}-${delay})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <CardContent className="relative z-10 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate transition-all duration-300',
                'group-hover:scale-105 origin-left',
                valueClassName
              )}>
                {value}
              </span>
            </div>
          </div>
          
          {icon && (
            <div className={cn(
              'p-2 rounded-lg transition-all duration-300',
              'bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110',
              variant === 'success' && 'bg-success/10 group-hover:bg-success/20',
              variant === 'danger' && 'bg-danger/10 group-hover:bg-danger/20',
              variant === 'warning' && 'bg-warning/10 group-hover:bg-warning/20',
            )}>
              <div className={cn(
                'h-4 w-4 sm:h-5 sm:w-5',
                variant === 'success' && 'text-success',
                variant === 'danger' && 'text-danger',
                variant === 'warning' && 'text-warning',
                variant === 'default' && 'text-primary',
                variant === 'primary' && 'text-primary',
              )}>
                {icon}
              </div>
            </div>
          )}
        </div>

        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-3">
            {trend !== undefined && (
              <span className={cn(
                'inline-flex items-center gap-1 text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full',
                isTrendPositive 
                  ? 'text-success bg-success/10' 
                  : 'text-danger bg-danger/10'
              )}>
                {isTrendPositive 
                  ? <ArrowUpIcon className="h-3 w-3" /> 
                  : <ArrowDownIcon className="h-3 w-3" />
                }
                {formattedTrend}
              </span>
            )}
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
            {description && !trendLabel && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>

      {/* Corner accent */}
      <div className={cn(
        'absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        'bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full'
      )} />
    </Card>
  );
}
