import { Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { getRelatedCalculators, supplementalCalculatorPaths } from '@/lib/related-calculators';

export function RelatedTools({ currentPath, limit = 4 }: { currentPath: string; limit?: number }) {
  const items = getRelatedCalculators(currentPath, limit);
  return (
    <section className="space-y-4 mt-8">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold">Related calculators</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((t) => (
          <Link key={t.href} to={t.href} className="block group">
            <Card className="p-4 h-full hover:border-primary/40 transition-colors">
              <div className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
                {t.title}
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SupplementalCalculatorLinks() {
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\/+$/, '');
  if (!supplementalCalculatorPaths.includes(currentPath)) return null;
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
      <RelatedTools currentPath={currentPath} />
    </div>
  );
}
