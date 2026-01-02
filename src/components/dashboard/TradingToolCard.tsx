
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TradingToolCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  delay?: number;
  gradient?: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
}

export function TradingToolCard({
  to,
  icon,
  title,
  description,
  buttonText = 'Open',
  delay = 0,
  gradient = 'purple',
}: TradingToolCardProps) {
  const gradientStyles = {
    purple: 'from-purple-500/10 via-primary/5 to-transparent',
    blue: 'from-blue-500/10 via-sky-500/5 to-transparent',
    green: 'from-emerald-500/10 via-green-500/5 to-transparent',
    orange: 'from-orange-500/10 via-amber-500/5 to-transparent',
    pink: 'from-pink-500/10 via-rose-500/5 to-transparent',
  };

  const iconColors = {
    purple: 'text-primary group-hover:text-primary',
    blue: 'text-blue-500 group-hover:text-blue-400',
    green: 'text-emerald-500 group-hover:text-emerald-400',
    orange: 'text-orange-500 group-hover:text-orange-400',
    pink: 'text-pink-500 group-hover:text-pink-400',
  };

  return (
    <Link to={to} className="block group">
      <Card 
        className={cn(
          'relative overflow-hidden h-full',
          'transition-all duration-500 ease-out',
          'hover:shadow-xl hover:shadow-primary/10',
          'hover:-translate-y-2 hover:scale-[1.02]',
          'border border-border/50 hover:border-primary/30',
          'bg-card/80 backdrop-blur-sm'
        )}
        style={{ 
          animationDelay: `${delay}ms`,
          animationFillMode: 'backwards'
        }}
      >
        {/* Animated gradient background */}
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          'bg-gradient-to-br',
          gradientStyles[gradient]
        )} />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-primary/20 animate-float" />
          <div className="absolute bottom-8 right-8 w-3 h-3 rounded-full bg-accent/20 animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 right-4 w-1.5 h-1.5 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <CardHeader className="relative z-10 pb-2">
          <div className={cn(
            'inline-flex p-3 rounded-xl mb-3',
            'bg-primary/10 group-hover:bg-primary/20',
            'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'
          )}>
            <div className={cn('h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-300', iconColors[gradient])}>
              {icon}
            </div>
          </div>
          <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
            {title}
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          <Button 
            variant="outline" 
            className={cn(
              'w-full transition-all duration-300',
              'group-hover:bg-primary group-hover:text-primary-foreground',
              'group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20'
            )}
          >
            {buttonText}
          </Button>
        </CardContent>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      </Card>
    </Link>
  );
}
