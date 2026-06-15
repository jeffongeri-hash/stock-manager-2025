import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  /** Visual heading for the widget. Not an <h1> — pages own the page H1. */
  heading?: string;
  defaultMode?: 'tracker' | 'calculator';
}

const fmtMoney = (n: number) =>
  isFinite(n)
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : '—';

/**
 * Coast FIRE Tracker / Calculator widget.
 * Uses the standard formulas:
 *   FIRE Number          = Annual Retirement Spending / Safe Withdrawal Rate
 *   Coast FIRE Today     = FIRE Number / (1 + real return) ^ years to retirement
 *   Projected at retire  = Current Invested * (1 + real return) ^ years
 */
export function CoastFireTrackerWidget({ heading = 'Coast FIRE Tracker' }: Props) {
  const [currentAge, setCurrentAge] = useState(32);
  const [retireAge, setRetireAge] = useState(65);
  const [invested, setInvested] = useState(75000);
  const [monthly, setMonthly] = useState(500);
  const [annualSpend, setAnnualSpend] = useState(50000);
  const [swr, setSwr] = useState(4);
  const [realReturn, setRealReturn] = useState(5);

  const result = useMemo(() => {
    const years = Math.max(0, retireAge - currentAge);
    const r = realReturn / 100;
    const sw = swr / 100;
    const fireNumber = annualSpend / sw;
    const coastToday = fireNumber / Math.pow(1 + r, years);
    // Future value WITHOUT contributions (pure Coast)
    const projectedNoContrib = invested * Math.pow(1 + r, years);
    // Future value WITH ongoing monthly contributions (added end-of-year)
    const annualContrib = monthly * 12;
    const projectedWithContrib =
      invested * Math.pow(1 + r, years) +
      (r > 0 ? annualContrib * ((Math.pow(1 + r, years) - 1) / r) : annualContrib * years);
    const pct = coastToday > 0 ? Math.min(100, (invested / coastToday) * 100) : 0;
    const gap = Math.max(0, coastToday - invested);

    // Year-by-year coast-FIRE-hit estimate WITH contributions
    let coastAge: number | null = null;
    let bal = invested;
    for (let i = 0; i <= years; i++) {
      const yearsLeft = years - i;
      const targetNow = fireNumber / Math.pow(1 + r, yearsLeft);
      if (bal >= targetNow && coastAge === null) coastAge = currentAge + i;
      bal = bal * (1 + r) + annualContrib;
    }

    // Build a small projection series for the sparkline.
    const series: { age: number; value: number; target: number }[] = [];
    let runBal = invested;
    for (let i = 0; i <= years; i++) {
      series.push({
        age: currentAge + i,
        value: runBal,
        target: fireNumber / Math.pow(1 + r, years - i),
      });
      runBal = runBal * (1 + r) + annualContrib;
    }

    return { years, fireNumber, coastToday, projectedNoContrib, projectedWithContrib, pct, gap, coastAge, series };
  }, [currentAge, retireAge, invested, monthly, annualSpend, swr, realReturn]);

  // Build SVG sparkline points
  const sparkline = useMemo(() => {
    const w = 600;
    const h = 160;
    const maxV = Math.max(
      ...result.series.map((p) => Math.max(p.value, p.target)),
      1,
    );
    const xs = (i: number) => (result.series.length === 1 ? 0 : (i / (result.series.length - 1)) * w);
    const ys = (v: number) => h - (v / maxV) * (h - 10) - 4;
    const valuePath = result.series.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.value).toFixed(1)}`).join(' ');
    const targetPath = result.series.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.target).toFixed(1)}`).join(' ');
    return { w, h, valuePath, targetPath };
  }, [result.series]);

  return (
    <Card className="p-5 sm:p-7 border-primary/20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary font-semibold">{heading}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Live calculation — change any field to see your Coast FIRE number update.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Current age" value={currentAge} setValue={setCurrentAge} min={10} max={90} />
        <Field label="Retirement age" value={retireAge} setValue={setRetireAge} min={20} max={100} />
        <Field label="Current invested ($)" value={invested} setValue={setInvested} min={0} step={1000} />
        <Field label="Monthly contribution ($)" value={monthly} setValue={setMonthly} min={0} step={50} />
        <Field label="Annual retirement spending ($)" value={annualSpend} setValue={setAnnualSpend} min={0} step={1000} />
        <Field label="Safe withdrawal rate (%)" value={swr} setValue={setSwr} min={1} max={10} step={0.1} />
        <Field label="Expected real return (%)" value={realReturn} setValue={setRealReturn} min={0} max={15} step={0.1} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Stat label="FIRE Number" value={fmtMoney(result.fireNumber)} />
        <Stat label="Coast FIRE Today" value={fmtMoney(result.coastToday)} accent />
        <Stat label="Gap to Coast FIRE" value={fmtMoney(result.gap)} />
        <Stat label="Coast FIRE age (with contributions)" value={result.coastAge ? String(result.coastAge) : '—'} />
        <Stat label="Projected at retirement (no contributions)" value={fmtMoney(result.projectedNoContrib)} />
        <Stat label="Projected at retirement (with contributions)" value={fmtMoney(result.projectedWithContrib)} />
      </div>


      <div className="mt-5">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">% of Coast FIRE reached</span>
          <span className="font-mono font-semibold text-primary">{result.pct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.round(result.pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gradient-to-r from-primary to-success transition-all" style={{ width: `${result.pct}%` }} />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Projection — your portfolio (solid) vs. Coast FIRE target line (dashed)
        </div>
        <div className="w-full overflow-hidden rounded-lg border border-border-soft bg-muted/30 p-2">
          <svg viewBox={`0 0 ${sparkline.w} ${sparkline.h}`} className="w-full h-40" aria-label="Coast FIRE projection chart">
            <path d={sparkline.targetPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="6 4" />
            <path d={sparkline.valuePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ages {currentAge}–{retireAge}. Real (inflation-adjusted) returns shown — change the inputs above to compare scenarios.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <a href="#tracker">Open the Free Coast FIRE Tracker</a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href="/coast-fire-calculator">Calculate My Coast FIRE Number</a>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Educational tool only — not financial, tax, or investment advice.
      </p>
    </Card>
  );
}

function Field({
  label, value, setValue, min, max, step = 1,
}: { label: string; value: number; setValue: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          setValue(isFinite(n) ? n : 0);
        }}
        className="mt-1 font-mono"
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? 'border-primary/40 bg-primary/5' : 'border-border-soft bg-muted/20'}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`font-mono text-lg sm:text-xl font-bold mt-0.5 ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}
