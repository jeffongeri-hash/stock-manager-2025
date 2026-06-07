import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface RelatedTool {
  href: string;
  title: string;
  blurb: string;
}

const ALL_TOOLS: RelatedTool[] = [
  { href: '/coast-fire-calculator', title: 'Coast FIRE Calculator', blurb: 'Find the age you can stop saving and let compounding finish the job.' },
  { href: '/financial-independence-calculator', title: 'Financial Independence Calculator', blurb: 'Project years to FI using the 4% rule, savings rate, and returns.' },
  { href: '/monthly-dividend-calculator', title: 'Monthly Dividend Calculator', blurb: 'Model DRIP compounding and monthly passive income from dividends.' },
  { href: '/covered-call-calculator', title: 'Covered Call Calculator', blurb: 'Premium income, annualized yield, breakeven, and rolling strategies.' },
  { href: '/paycheck-calculator', title: 'Paycheck Calculator', blurb: 'Federal, state, and local tax estimates for your real take-home pay.' },
  { href: '/fire-guide', title: 'FIRE Guide', blurb: 'Lean, Fat, Barista, and Coast FIRE explained with inflation-adjusted numbers.' },
  { href: '/dividend-tracker', title: 'Dividend Tracker', blurb: 'Track yield on cost, CAGR, and full dividend income across a portfolio.' },
  { href: '/retirement-planning', title: 'Retirement Planning', blurb: 'FIRE, Roth conversion, Social Security, and withdrawal strategies.' },
  { href: '/real-estate', title: 'Real Estate Calculator', blurb: 'Rental ROI, mortgage math, and property cash-flow comparison.' },
  { href: '/car-finance', title: 'Car Finance Calculator', blurb: 'Auto loan payments, depreciation, and total cost of ownership.' },
  { href: '/options-portfolio', title: 'Options Toolkit', blurb: 'Wheel, PMCC, iron condors, Greeks, and covered call analyzers.' },
];

export function RelatedTools({ currentPath, limit = 4 }: { currentPath: string; limit?: number }) {
  const items = ALL_TOOLS.filter((t) => t.href !== currentPath).slice(0, limit);
  return (
    <section className="space-y-4 mt-8">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold">Related calculators &amp; tools</h2>
      <p className="text-sm text-muted-foreground">
        Free, no signup. Explore the rest of the Profit Pathfinder suite.
      </p>
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
