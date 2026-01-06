import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, TrendingUp, Bell, BookOpen, Search, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const quickActions = [
  { icon: Search, label: 'Research Stock', path: '/stock-research', color: 'bg-blue-500' },
  { icon: Bell, label: 'New Alert', path: '/alerts', color: 'bg-amber-500' },
  { icon: TrendingUp, label: 'View Watchlist', path: '/watchlist', color: 'bg-green-500' },
  { icon: BookOpen, label: 'Trade Journal', path: '/trade-journal', color: 'bg-purple-500' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio', color: 'bg-indigo-500' },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      <div className={cn(
        "fixed right-4 bottom-24 z-50 flex flex-col-reverse gap-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <button
            key={action.path}
            onClick={() => handleAction(action.path)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
              "bg-card border border-border text-foreground",
              "hover:scale-105 active:scale-95"
            )}
            style={{ 
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              transform: isOpen ? 'translateX(0)' : 'translateX(20px)'
            }}
          >
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            <div className={cn("p-2 rounded-full text-white", action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
          </button>
        ))}
      </div>

      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-4 bottom-24 z-50 h-14 w-14 rounded-full shadow-xl",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 active:scale-95",
          isOpen && "rotate-45 bg-destructive hover:bg-destructive/90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </>
  );
}
