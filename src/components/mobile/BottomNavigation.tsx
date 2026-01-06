import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Bell, Settings, MoreHorizontal, X, TrendingUp, Calculator, Newspaper, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const primaryNavItems: NavItem[] = [
  { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
  { icon: <Briefcase className="h-5 w-5" />, label: 'Portfolio', path: '/portfolio' },
  { icon: <TrendingUp className="h-5 w-5" />, label: 'Markets', path: '/market-news' },
  { icon: <Bell className="h-5 w-5" />, label: 'Alerts', path: '/alert-history' },
];

const moreNavItems: NavItem[] = [
  { icon: <Calculator className="h-5 w-5" />, label: 'Toolkit', path: '/trading-toolkit' },
  { icon: <Newspaper className="h-5 w-5" />, label: 'Research', path: '/stock-research' },
  { icon: <Target className="h-5 w-5" />, label: 'Retirement', path: '/retirement-planning' },
  { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' },
];

export function BottomNavigation() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNavItems.some(item => isActive(item.path));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {primaryNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                active && "bg-primary/15 scale-105"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More menu */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isMoreActive && "bg-primary/15 scale-105"
              )}>
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors",
                isMoreActive && "text-primary"
              )}>
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Quick Access</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 pb-6">
              {moreNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 active:scale-95",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <div className="mb-1.5">{item.icon}</div>
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
