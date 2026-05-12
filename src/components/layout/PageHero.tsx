import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HeroStatProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'primary' | 'warning';
  icon?: ReactNode;
  className?: string;
}

const toneStyles: Record<NonNullable<HeroStatProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  danger:  'text-danger',
  primary: 'text-primary',
  warning: 'text-warning',
};

const iconBg: Record<NonNullable<HeroStatProps['tone']>, string> = {
  default: 'bg-muted/40 text-muted-foreground',
  success: 'bg-success/15 text-success border border-success/25',
  danger:  'bg-danger/15  text-danger  border border-danger/25',
  primary: 'bg-primary/15 text-primary border border-primary/25',
  warning: 'bg-warning/15 text-warning border border-warning/25',
};

export function HeroStat({ label, value, sub, tone = 'default', icon, className }: HeroStatProps) {
  return (
    <div className={cn(
      'glass-card stats-card-glow rounded-[var(--radius)] p-4 sm:p-5 transition hover:-translate-y-[1px]',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className={cn('w-6 h-6 rounded-md grid place-items-center', iconBg[tone])}>
            {icon}
          </span>
        )}
        <span className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {label}
        </span>
      </div>
      <div className={cn('font-mono text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight leading-none', toneStyles[tone])}>
        {value}
      </div>
      {sub != null && (
        <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;          // can include <span class="gradient-text">
  description?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;         // typically <HeroStat /> grid
  className?: string;
}

export function PageHero({ eyebrow, title, description, actions, stats, className }: PageHeroProps) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div>
          {eyebrow && (
            <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-muted-foreground mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {stats}
    </section>
  );
}
