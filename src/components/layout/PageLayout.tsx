import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        {/* Sidebar - hidden on mobile, visible on large screens */}
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        <main className="flex-1 transition-all duration-300 w-full min-w-0">
          <div className="w-full p-3 sm:p-4 lg:p-6 animate-fade-in">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
