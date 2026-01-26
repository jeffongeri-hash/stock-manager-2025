import React, { useState, useEffect } from 'react';
import { 
  PieChart, Wallet, LineChart, 
  Settings, ChevronRight, ChevronLeft, Home, Calculator,
  TrendingUp, FolderKanban, Zap, BookOpen, Activity,
  TestTube, Users, Radar, FileText, BookMarked,
  Grid3X3, DollarSign, CalendarDays, GitCompare, Shield, Newspaper,
  Scale, Webhook, Cpu, Eye, FlaskConical, Target, Building2, Car, GitCompareArrows,
  Briefcase, Bot, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

export function Sidebar({ isCollapsed, onToggle, className }: SidebarProps) {
  const location = useLocation();
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, message: '' });
  
  useEffect(() => {
    const updateMarketStatus = () => {
      // Get current time in EST/EDT (UTC-5 or UTC-4)
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      
      const day = estTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();
      
      // Market is closed on weekends
      if (day === 0 || day === 6) {
        const daysUntilMonday = day === 0 ? 1 : 2;
        setMarketStatus({ 
          isOpen: false, 
          message: `Closed - Opens Monday 9:30 AM EST`
        });
        return;
      }
      
      // Convert current time to minutes since midnight
      const currentMinutes = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      if (currentMinutes < marketOpen) {
        // Before market opens
        const minutesUntilOpen = marketOpen - currentMinutes;
        const hoursUntil = Math.floor(minutesUntilOpen / 60);
        const minsUntil = minutesUntilOpen % 60;
        setMarketStatus({ 
          isOpen: false, 
          message: `Opens in ${hoursUntil}h ${minsUntil}m`
        });
      } else if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        // Market is open
        const minutesUntilClose = marketClose - currentMinutes;
        const hoursUntil = Math.floor(minutesUntilClose / 60);
        const minsUntil = minutesUntilClose % 60;
        setMarketStatus({ 
          isOpen: true, 
          message: `Closes in ${hoursUntil}h ${minsUntil}m`
        });
      } else {
        // After market closes
        setMarketStatus({ 
          isOpen: false, 
          message: `Closed - Opens tomorrow 9:30 AM EST`
        });
      }
    };
    
    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const navItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/',
    },
    {
      title: 'Assets',
      icon: Wallet,
      href: '/assets',
    },
    {
      title: 'Portfolio',
      icon: FolderKanban,
      href: '/portfolio',
    },
    {
      title: 'Performance',
      icon: LineChart,
      href: '/performance',
    },
    {
      title: 'Analysis',
      icon: PieChart,
      href: '/analysis',
    },
    {
      title: 'Trading Toolkit',
      icon: Calculator,
      href: '/trading-toolkit',
    },
    {
      title: 'Options Toolkit',
      icon: Scale,
      href: '/options-portfolio',
    },
    {
      title: '0 DTE Calculator',
      icon: Zap,
      href: '/zero-dte',
    },
    {
      title: 'Multi-Stock Research',
      icon: FlaskConical,
      href: '/stock-research',
    },
    {
      title: 'Market Scanner',
      icon: Radar,
      href: '/market-scanner',
    },
    {
      title: 'Reports',
      icon: FileText,
      href: '/reports',
    },
    {
      title: 'Dividend Tracker',
      icon: DollarSign,
      href: '/dividend-tracker',
    },
    {
      title: 'Economic Calendar',
      icon: CalendarDays,
      href: '/economic-calendar',
    },
    {
      title: 'Risk & Correlation',
      icon: Shield,
      href: '/risk-metrics',
    },
    {
      title: 'Portfolio Rebalancing',
      icon: Scale,
      href: '/portfolio-rebalancing',
    },
    {
      title: 'ETF Comparison',
      icon: GitCompareArrows,
      href: '/etf-comparison',
    },
    {
      title: 'TradingView Integration',
      icon: Webhook,
      href: '/tradingview-webhook',
    },
    {
      title: 'Trading Automation',
      icon: Cpu,
      href: '/trading-automation',
    },
    {
      title: 'SmartTrade AI',
      icon: Bot,
      href: '/smarttrade-ai',
    },
    {
      title: 'QuantGemini',
      icon: FlaskConical,
      href: '/quantgemini',
    },
    {
      title: 'Paycheck Allocator',
      icon: Receipt,
      href: '/paycheck-allocator',
    },
    {
      title: 'Watchlist & Alerts',
      icon: Eye,
      href: '/watchlist',
    },
    {
      title: 'Retirement Planning',
      icon: Target,
      href: '/retirement-planning',
    },
    {
      title: 'Real Estate',
      icon: Building2,
      href: '/real-estate',
    },
    {
      title: 'Car Finance',
      icon: Car,
      href: '/car-finance',
    },
    {
      title: 'Credit Options Guide',
      icon: BookMarked,
      href: '/credit-options-guide',
    },
    {
      title: 'Options Strategy Guide',
      icon: BookOpen,
      href: '/options-guide',
    },
    {
      title: 'Fundamental Analysis Guide',
      icon: Activity,
      href: '/fundamental-analysis-guide',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
    }
  ];

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground relative transition-all duration-300 ease-in-out flex flex-col border-r border-sidebar-border h-screen sticky top-0",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border shrink-0">
        <h2 className={cn(
          "font-semibold tracking-tight transition-opacity duration-200",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}>
          Profit Pathway
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute right-2 text-sidebar-foreground h-8 w-8",
            isCollapsed ? "right-2" : "right-4"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={index}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0")} />
                <span className={cn(
                  "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className={cn(
          "transition-opacity duration-200 rounded-md p-2 text-xs",
          isCollapsed ? "opacity-0" : "opacity-100",
          marketStatus.isOpen ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/20 text-red-700 dark:text-red-400"
        )}>
          <p className="font-medium">Market Status</p>
          <p className="font-semibold">{marketStatus.isOpen ? 'Markets are open' : 'Markets are closed'}</p>
          <p className="text-[10px] mt-1">{marketStatus.message}</p>
        </div>
      </div>
    </aside>
  );
}
