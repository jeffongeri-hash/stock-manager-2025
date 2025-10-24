import React from 'react';
import { Search, User, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useTheme } from 'next-themes';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  return (
    <header className={cn("bg-background/95 backdrop-blur-sm sticky top-0 z-30 border-b", className)}>
      <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar isCollapsed={false} onToggle={() => {}} />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-base sm:text-lg font-semibold tracking-tight lg:text-xl">MarketPulse</h1>
          
          <div className="relative hidden md:flex items-center h-9 rounded-md px-3 text-muted-foreground focus-within:text-foreground bg-muted/50">
            <Search className="h-4 w-4 mr-2" />
            <Input 
              type="search" 
              placeholder="Search stocks, indices..." 
              className="h-9 w-[200px] lg:w-[280px] bg-transparent border-none px-0 py-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 transition-transform duration-200 hover:scale-105">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 sm:h-9 sm:w-9">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
