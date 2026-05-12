import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, User, Menu, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavItem { title: string; href: string; }

const PRIMARY_NAV: NavItem[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Assets', href: '/assets' },
  { title: 'Portfolio', href: '/portfolio' },
  { title: 'Performance', href: '/performance' },
  { title: 'Analysis', href: '/analysis' },
  { title: 'Trading', href: '/trading-toolkit' },
  { title: 'Options', href: '/options-portfolio' },
  { title: '0DTE', href: '/zero-dte' },
  { title: 'Research', href: '/stock-research' },
  { title: 'Scanner', href: '/market-scanner' },
  { title: 'Dividends', href: '/dividend-tracker' },
  { title: 'Risk', href: '/risk-metrics' },
  { title: 'Rebalance', href: '/portfolio-rebalancing' },
  { title: 'ETFs', href: '/etf-comparison' },
  { title: 'SmartTrade', href: '/smarttrade-ai' },
  { title: 'QuantGemini', href: '/quantgemini' },
  { title: 'IgniteFIRE', href: '/ignite-fire' },
  { title: 'Retirement', href: '/retirement-planning' },
  { title: 'Real Estate', href: '/real-estate' },
  { title: 'Car Finance', href: '/car-finance' },
  { title: 'Guides', href: '/options-guide' },
];

export function TopNav() {
  const { user, signOut, isGuestMode } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { pathname } = useLocation();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/85 border-b border-border-soft safe-area-top">
      {/* Brand row */}
      <div className="flex items-center justify-between h-14 px-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile drawer trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 safe-area-left bg-sidebar">
              <div className="h-full overflow-y-auto">
                <Sidebar isCollapsed={false} onToggle={() => {}} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="grid place-items-center w-8 h-8 rounded-lg text-white text-[11px] font-extrabold tracking-tight"
                  style={{ backgroundImage: 'var(--gradient-brand)' }}>
              PP
            </span>
            <span className="font-display text-lg sm:text-xl font-semibold tracking-tight gradient-text">
              Profit Pathway
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 nav-pill bg-success/10 text-success border border-success/25">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-gentle" />
            Live
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : isGuestMode ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
                <UserCircle className="h-3 w-3" /> Guest
              </Badge>
              <Button size="sm" onClick={() => navigate('/auth')} className="text-xs">Sign In</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>
      </div>

      {/* Page tab strip */}
      <nav className="border-t border-border-soft bg-background/60">
        <div
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-3 sm:px-5 h-11"
          role="tablist"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "shrink-0 px-3 h-8 inline-flex items-center rounded-full text-xs font-semibold tracking-wide transition-colors",
                  "uppercase",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
