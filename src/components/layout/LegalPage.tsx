import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

export const LAST_UPDATED = 'October 14, 2026';

export function LegalPage({ title, children, showUpdated = true }: { title: string; children: React.ReactNode; showUpdated?: boolean }) {
  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto space-y-6 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        <header>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          {showUpdated && <p className="text-sm mt-2">Last updated: {LAST_UPDATED}</p>}
        </header>
        {children}
      </article>
    </PageLayout>
  );
}

export const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);
