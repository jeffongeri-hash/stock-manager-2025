import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import {
  PieChart, Wallet, LineChart, Calculator, Zap, BookOpen, Activity,
  DollarSign, Scale, FlaskConical, Target, Building2, Car, Bot,
  FolderKanban, BookMarked, Sparkles, Flame, TrendingUp, Receipt,
} from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

const TOOLS: Tool[] = [
  { title: 'Assets', description: 'Aggregate holdings across all your brokerages.', href: '/assets', icon: Wallet, category: 'Portfolio' },
  { title: 'Portfolio', description: 'Track positions, allocations, and risk in one place.', href: '/portfolio', icon: FolderKanban, category: 'Portfolio' },
  { title: 'Performance', description: 'Returns, P&L breakdowns, and historical performance.', href: '/performance', icon: LineChart, category: 'Portfolio' },
  { title: 'Trading Toolkit', description: 'Advanced trading calculators and planners.', href: '/trading-toolkit', icon: Calculator, category: 'Trading' },
  { title: 'Options Toolkit', description: 'PMCC, Wheel, Iron Condor, and ITM tools.', href: '/options-portfolio', icon: Scale, category: 'Options' },
  { title: '0DTE Calculator', description: 'Same-day options strategy planner.', href: '/zero-dte', icon: Zap, category: 'Options' },
  { title: 'Dividend Tracker', description: 'CAGR, yield-on-cost, and dividend growth.', href: '/dividend-tracker', icon: DollarSign, category: 'Income' },
  { title: 'Risk & Rebalance', description: 'Portfolio rebalancing and risk metrics.', href: '/portfolio-rebalancing', icon: Scale, category: 'Portfolio' },
  { title: 'IgniteFIRE Suite', description: 'Full FIRE retirement planning suite.', href: '/ignite-fire', icon: Flame, category: 'FIRE' },
  { title: 'Retirement Planning', description: 'SS, RMD, Roth conversion, and withdrawals.', href: '/retirement-planning', icon: Target, category: 'FIRE' },
  { title: 'Real Estate', description: 'Cash flow, cap rate, and property analysis.', href: '/real-estate', icon: Building2, category: 'Real Estate' },
  { title: 'Car Finance', description: 'Loan, lease, and depreciation analysis.', href: '/car-finance', icon: Car, category: 'Lifestyle' },
  { title: 'Coast FIRE Calculator', description: 'When can you stop saving and still retire?', href: '/coast-fire-calculator', icon: Flame, category: 'FIRE' },
  { title: 'FIRE Calculator', description: 'Project your path to financial independence.', href: '/financial-independence-calculator', icon: TrendingUp, category: 'FIRE' },
  { title: 'Covered Call Calculator', description: 'Premium income and assignment analysis.', href: '/covered-call-calculator', icon: Sparkles, category: 'Options' },
  { title: 'Monthly Dividend Calculator', description: 'Plan monthly dividend income.', href: '/monthly-dividend-calculator', icon: DollarSign, category: 'Income' },
  { title: 'Credit Options Guide', description: 'Learn credit spreads, iron condors, and more.', href: '/credit-options-guide', icon: BookMarked, category: 'Education' },
  { title: 'Options Strategy Guide', description: 'LEAPS, Covered Calls, and 0DTE checklists.', href: '/options-guide', icon: BookOpen, category: 'Education' },
  { title: 'Fundamental Analysis Guide', description: 'CAN SLIM and ratio appropriateness.', href: '/fundamental-analysis-guide', icon: Activity, category: 'Education' },
  { title: 'FIRE Guide', description: 'Beginner-friendly FIRE roadmap.', href: '/fire-guide', icon: BookOpen, category: 'Education' },
];

const categoryOrder = ['Portfolio', 'Trading', 'Options', 'Income', 'FIRE', 'Real Estate', 'Lifestyle', 'Education'];

const AllTools = () => {
  const grouped = categoryOrder
    .map((cat) => ({ category: cat, tools: TOOLS.filter((t) => t.category === cat) }))
    .filter((g) => g.tools.length > 0);

  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" /> {TOOLS.length} Tools
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">All Tools</h1>
          <p className="text-muted-foreground mt-2">
            Every calculator, tracker, and AI tool on Profit Pathfinder — organized by category.
          </p>
        </div>

        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="font-display text-xl font-semibold mb-4">{group.category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} to={tool.href}>
                    <Card className="p-5 h-full hover:border-primary/50 hover:bg-card/80 transition-all group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground leading-snug">{tool.description}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  );
};

export default AllTools;
