import { useState, useMemo } from 'react';
import { SeoCalculatorPage } from '@/components/seo/SeoCalculatorPage';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CoveredCallCalculator() {
  const [stockPrice, setStockPrice] = useState(100);
  const [strike, setStrike] = useState(105);
  const [premium, setPremium] = useState(2.5);
  const [shares, setShares] = useState(100);
  const [days, setDays] = useState(30);

  const r = useMemo(() => {
    const contracts = Math.floor(shares / 100);
    const totalPremium = premium * 100 * contracts;
    const cost = stockPrice * shares;
    const maxProfit = (strike - stockPrice) * shares + totalPremium;
    const breakeven = stockPrice - premium;
    const staticReturn = (totalPremium / cost) * 100;
    const calledReturn = (maxProfit / cost) * 100;
    const annualizedStatic = (staticReturn * 365) / days;
    const annualizedCalled = (calledReturn * 365) / days;
    return { contracts, totalPremium, cost, maxProfit, breakeven, staticReturn, calledReturn, annualizedStatic, annualizedCalled };
  }, [stockPrice, strike, premium, shares, days]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const pct = (n: number) => `${n.toFixed(2)}%`;

  return (
    <SeoCalculatorPage
      path="/covered-call-calculator"
      title="Covered Call Calculator — Free Return & Premium Tool"
      h1="Covered Call Calculator"
      description="Calculate covered call returns, breakeven, max profit, and annualized yield. Free covered call calculator for any stock, strike, and expiration."
      keywords={['covered call calculator', 'covered call return calculator', 'covered call yield', 'options income calculator', 'wheel strategy calculator']}
      ctaHref="/options-portfolio"
      ctaLabel="Open the full Options Toolkit"
      faqs={[
        { q: 'What is a covered call?', a: 'A covered call is selling a call option against 100 shares of stock you already own. You collect the premium upfront. If the stock stays below the strike at expiration, you keep the shares and the premium. If it closes above, your shares are "called away" at the strike price.' },
        { q: 'How is covered call return calculated?', a: 'Static return = premium received ÷ cost basis. Called return = (strike − cost basis + premium) ÷ cost basis. Both can be annualized by multiplying by 365 ÷ days to expiration.' },
        { q: 'What strike price should I choose?', a: 'OTM strikes (above current price) give upside if called and lower premium. ATM strikes maximize premium but risk losing shares. A common rule: pick a strike at the 30 delta level — gives ~30% probability of being called and balances income with capital growth.' },
        { q: 'Are covered calls risky?', a: 'Covered calls cap your upside but do not protect downside — if the stock drops, you still own the shares. The premium provides only a small cushion. Risk is similar to owning the stock minus the upside above the strike.' },
        { q: 'What is the difference between a covered call and a poor man\'s covered call (PMCC)?', a: 'A standard covered call uses 100 shares of stock as collateral. A PMCC uses a deep ITM LEAPS call instead, which requires less capital but adds time-decay risk and expiration management.' },
      ]}
    >
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sp">Stock price ($)</Label>
            <Input id="sp" type="number" step="0.01" value={stockPrice} onChange={(e) => setStockPrice(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sk">Strike price ($)</Label>
            <Input id="sk" type="number" step="0.01" value={strike} onChange={(e) => setStrike(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr">Premium per share ($)</Label>
            <Input id="pr" type="number" step="0.01" value={premium} onChange={(e) => setPremium(+e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sh">Shares owned</Label>
            <Input id="sh" type="number" step="100" value={shares} onChange={(e) => setShares(+e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="d">Days to expiration</Label>
            <Input id="d" type="number" value={days} onChange={(e) => setDays(+e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
          <Stat label="Total premium" value={fmt(r.totalPremium)} highlight />
          <Stat label="Max profit if called" value={fmt(r.maxProfit)} />
          <Stat label="Breakeven" value={`$${r.breakeven.toFixed(2)}`} />
          <Stat label="Contracts" value={r.contracts.toString()} />
          <Stat label="Static return" value={pct(r.staticReturn)} />
          <Stat label="Static (annualized)" value={pct(r.annualizedStatic)} highlight />
          <Stat label="If-called return" value={pct(r.calledReturn)} />
          <Stat label="If-called (annualized)" value={pct(r.annualizedCalled)} highlight />
        </div>
      </Card>
    </SeoCalculatorPage>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20 border border-border'}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
