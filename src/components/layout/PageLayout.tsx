import React from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Orbs } from '@/components/layout/Orbs';
import { GuestModeBanner } from '@/components/layout/GuestModeBanner';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Orbs />
      <div className="relative z-10 flex flex-col min-h-screen">
        <GuestModeBanner />
        <TopNav />
        <main className="flex-1 w-full">
          <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-6 sm:mb-8">
              {title}
            </h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
