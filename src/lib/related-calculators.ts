export const calculatorTools = [
  { href: '/coast-fire-tracker', title: 'Coast FIRE Tracker', blurb: 'Track your progress toward your Coast FIRE number.' },
  { href: '/coast-fire-calculator', title: 'Coast FIRE Calculator', blurb: 'Find the age you can stop saving and let compounding finish the job.' },
  { href: '/coast-fire-number', title: 'Coast FIRE Number', blurb: 'Calculate your Coast FIRE target by age.' },
  { href: '/coast-fire-healthcare', title: 'Coast FIRE for Healthcare Workers', blurb: 'Coast FIRE for PAs, NPs, and nurses going part-time or per diem.' },
  { href: '/early-retirement-calculator', title: 'Early Retirement Calculator', blurb: 'Estimate your retirement timeline and savings goals.' },
  { href: '/financial-independence-calculator', title: 'Financial Independence Calculator', blurb: 'Project years to FI using the 4% rule, savings rate, and returns.' },
  { href: '/monthly-dividend-calculator', title: 'Monthly Dividend Calculator', blurb: 'Model DRIP compounding and monthly passive income from dividends.' },
  { href: '/dividend-tracker', title: 'Dividend Tracker', blurb: 'Track yield on cost, CAGR, and full dividend income across a portfolio.' },
  { href: '/covered-call-calculator', title: 'Covered Call Calculator', blurb: 'Premium income, annualized yield, breakeven, and rolling strategies.' },
  { href: '/options-portfolio', title: 'Options Toolkit', blurb: 'Wheel, PMCC, iron condors, Greeks, and covered call analyzers.' },
  { href: '/trading-toolkit', title: 'Trading Toolkit', blurb: 'Position sizing, trading risk, and options calculations.' },
  { href: '/zero-dte', title: '0DTE Options Scanner', blurb: 'Explore same-day options and model trading scenarios.' },
  { href: '/retirement-planning', title: 'Retirement Planning', blurb: 'FIRE, Roth conversion, Social Security, and withdrawal strategies.' },
  { href: '/fire-guide', title: 'FIRE Guide', blurb: 'Lean, Fat, Barista, and Coast FIRE explained with inflation-adjusted numbers.' },
  { href: '/real-estate', title: 'Real Estate Calculator', blurb: 'Rental ROI, mortgage math, and property cash-flow comparison.' },
  { href: '/car-finance', title: 'Car Finance Calculator', blurb: 'Auto loan payments, depreciation, and total cost of ownership.' },
];

const fire = ['/coast-fire-tracker', '/coast-fire-calculator', '/coast-fire-number', '/coast-fire-healthcare', '/early-retirement-calculator', '/financial-independence-calculator', '/retirement-planning', '/fire-guide'];
const income = ['/dividend-tracker', '/monthly-dividend-calculator', '/covered-call-calculator', '/retirement-planning', '/financial-independence-calculator'];
const trading = ['/covered-call-calculator', '/options-portfolio', '/trading-toolkit', '/zero-dte', '/dividend-tracker'];
const finance = ['/real-estate', '/car-finance', '/retirement-planning', '/financial-independence-calculator', '/early-retirement-calculator'];

/** Pages without an existing in-page RelatedTools block. */
export const supplementalCalculatorPaths = [
  '/dividend-tracker', '/trading-toolkit', '/options-portfolio', '/zero-dte',
  '/retirement-planning', '/real-estate', '/car-finance', '/fire-guide',
];

export function getRelatedCalculators(currentPath: string, limit = 4) {
  const group = ['/dividend-tracker', '/monthly-dividend-calculator'].includes(currentPath)
    ? income
    : trading.includes(currentPath)
      ? trading
      : ['/real-estate', '/car-finance'].includes(currentPath)
        ? finance
        : fire;
  return group.filter((href) => href !== currentPath).slice(0, Math.min(5, Math.max(3, limit)))
    .flatMap((href) => {
      const tool = calculatorTools.find((item) => item.href === href);
      return tool ? [tool] : [];
    });
}