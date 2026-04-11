import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  BarSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Layers,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OHLCVBar {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SymbolInfo {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  baseVolume: number;
  isCrypto?: boolean;
}

interface Indicators {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  bbands: boolean;
  rsi: boolean;
  volume: boolean;
}

type ChartType = 'candlestick' | 'bar' | 'line' | 'area';

// ── Constants ─────────────────────────────────────────────────────────────────

const SYMBOLS: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 187.32, volatility: 0.015, baseVolume: 58_000_000 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 402.65, volatility: 0.012, baseVolume: 22_000_000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 157.95, volatility: 0.014, baseVolume: 18_000_000 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 950.02, volatility: 0.025, baseVolume: 42_000_000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 237.47, volatility: 0.030, baseVolume: 67_000_000 },
  { symbol: 'META', name: 'Meta Platforms', basePrice: 474.99, volatility: 0.018, baseVolume: 15_000_000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 179.83, volatility: 0.016, baseVolume: 27_000_000 },
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 65_841.25, volatility: 0.028, baseVolume: 28_000_000_000, isCrypto: true },
  { symbol: 'ETH', name: 'Ethereum', basePrice: 3_487.92, volatility: 0.030, baseVolume: 14_000_000_000, isCrypto: true },
  { symbol: 'SOL', name: 'Solana', basePrice: 143.28, volatility: 0.040, baseVolume: 4_720_000_000, isCrypto: true },
];

const TIMEFRAMES = [
  { label: '1m',  seconds: 60,      count: 390 },
  { label: '5m',  seconds: 300,     count: 390 },
  { label: '15m', seconds: 900,     count: 400 },
  { label: '1H',  seconds: 3600,    count: 400 },
  { label: '4H',  seconds: 14400,   count: 400 },
  { label: '1D',  seconds: 86400,   count: 365 },
  { label: '1W',  seconds: 604800,  count: 260 },
];

const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: 'candlestick', label: 'Candles', icon: '🕯' },
  { type: 'bar',         label: 'Bars',    icon: '⊣' },
  { type: 'line',        label: 'Line',    icon: '/' },
  { type: 'area',        label: 'Area',    icon: '◢' },
];

// ── Seeded PRNG ───────────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h;
}

// ── Data Generation ───────────────────────────────────────────────────────────

function generateOHLCV(
  info: SymbolInfo,
  intervalSecs: number,
  count: number,
): OHLCVBar[] {
  const rand = makeRng(hashStr(info.symbol) ^ intervalSecs);

  // Generate a "historical" starting price well before current price
  let price = info.basePrice * (0.60 + rand() * 0.25);

  const now = Math.floor(Date.now() / 1000);
  const snapped = now - (now % intervalSecs);
  const startTime = snapped - (count - 1) * intervalSecs;

  const bars: OHLCVBar[] = [];

  for (let i = 0; i < count; i++) {
    const time = (startTime + i * intervalSecs) as Time;
    const open = i === 0 ? price : bars[i - 1].close;

    const drift = 0.00015;
    const ret = drift + (rand() - 0.5) * info.volatility * 2.2;
    const close = Math.max(open * (1 + ret), 0.01);

    const spread = Math.abs(close - open);
    const wickMult = rand() * info.volatility * 0.8;
    const high = Math.max(open, close) + wickMult * open + rand() * spread;
    const low  = Math.min(open, close) - wickMult * open * 0.6 - rand() * spread * 0.5;

    const volume = info.baseVolume * (0.25 + rand() * 1.5);

    const dec = info.isCrypto || info.basePrice >= 100 ? 2 : 4;
    bars.push({
      time,
      open:   +open.toFixed(dec),
      high:   +high.toFixed(dec),
      low:    +Math.max(low, 0.001).toFixed(dec),
      close:  +close.toFixed(dec),
      volume: Math.round(volume),
    });

    price = close;
  }

  return bars;
}

// ── Technical Indicators ──────────────────────────────────────────────────────

function calcSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (i === period - 1) {
      prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out.push(prev);
      continue;
    }
    prev = values[i] * k + prev! * (1 - k);
    out.push(+prev.toFixed(4));
  }
  return out;
}

function calcBB(values: number[], period: number, mult = 2) {
  const mid = calcSMA(values, period);
  return values.map((_, i) => {
    if (mid[i] === null) return { upper: null, middle: null, lower: null };
    const avg = mid[i]!;
    const slice = values.slice(i - period + 1, i + 1);
    const variance = slice.reduce((s, v) => s + (v - avg) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    return {
      upper:  +(avg + mult * std).toFixed(4),
      middle: +avg.toFixed(4),
      lower:  +(avg - mult * std).toFixed(4),
    };
  });
}

function calcRSI(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period) { out.push(null); continue; }
    let gain = 0, loss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j] - values[j - 1];
      if (d > 0) gain += d; else loss -= d;
    }
    const rs = loss === 0 ? Infinity : gain / loss;
    out.push(+(100 - 100 / (1 + rs)).toFixed(2));
  }
  return out;
}

// ── Theme helpers ─────────────────────────────────────────────────────────────

function detectDark(): boolean {
  return (
    document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
}

function chartColors(dark: boolean) {
  return {
    bg:          dark ? '#131722' : '#ffffff',
    text:        dark ? '#d1d4dc' : '#131722',
    grid:        dark ? '#1e2334' : '#f0f3fa',
    border:      dark ? '#2a2e39' : '#e0e3eb',
    up:          '#26a69a',
    down:        '#ef5350',
    volUp:       'rgba(38,166,154,0.45)',
    volDown:     'rgba(239,83,80,0.45)',
    crosshair:   dark ? '#758696' : '#9598a1',
    crosshairBg: dark ? '#2a2e39' : '#f0f3fa',
  };
}

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtPrice(v: number) {
  if (v >= 10000) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 100)   return v.toFixed(2);
  if (v >= 1)     return v.toFixed(4);
  return v.toFixed(6);
}

function fmtVol(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9)  return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6)  return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3)  return (v / 1e3).toFixed(1) + 'K';
  return v.toString();
}

function fmtChange(open: number, close: number) {
  const chg = close - open;
  const pct = (chg / open) * 100;
  const sign = chg >= 0 ? '+' : '';
  return { chg: sign + chg.toFixed(2), pct: sign + pct.toFixed(2) + '%', up: chg >= 0 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [symbol,    setSymbol]    = useState<SymbolInfo>(SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[5]); // 1D
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState<Indicators>({
    sma20:  false,
    sma50:  false,
    ema20:  false,
    bbands: false,
    rsi:    false,
    volume: true,
  });
  const [dark,   setDark]   = useState(detectDark);
  const [legend, setLegend] = useState<OHLCVBar | null>(null);
  const [live,   setLive]   = useState(false);

  // Generate OHLCV data (memoised, stable across re-renders)
  const ohlcv = useMemo(
    () => generateOHLCV(symbol, timeframe.seconds, timeframe.count),
    [symbol, timeframe],
  );

  // Watch theme changes
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(detectDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Build / rebuild chart whenever data, type, or indicators change
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
    }

    const c = chartColors(dark);

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: c.bg },
        textColor: c.text,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: c.grid },
        horzLines: { color: c.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: c.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: c.crosshairBg,
        },
        horzLine: {
          color: c.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: c.crosshairBg,
        },
      },
      rightPriceScale: {
        borderColor: c.border,
      },
      timeScale: {
        borderColor: c.border,
        timeVisible: true,
        secondsVisible: timeframe.seconds < 3600,
        rightOffset: 5,
      },
    });

    chartRef.current = chart;

    // ── Main series ────────────────────────────────────────────────────────

    let mainSeries: ISeriesApi<SeriesType>;

    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor:        c.up,
        downColor:      c.down,
        wickUpColor:    c.up,
        wickDownColor:  c.down,
        borderVisible:  false,
      });
      mainSeries.setData(
        ohlcv.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })),
      );
    } else if (chartType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor:   c.up,
        downColor: c.down,
      });
      mainSeries.setData(
        ohlcv.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })),
      );
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor:   '#2196F3',
        topColor:    'rgba(33,150,243,0.40)',
        bottomColor: 'rgba(33,150,243,0.02)',
        lineWidth:   2,
      });
      mainSeries.setData(ohlcv.map(({ time, close }) => ({ time, value: close })));
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color:     '#2196F3',
        lineWidth: 2,
      });
      mainSeries.setData(ohlcv.map(({ time, close }) => ({ time, value: close })));
    }

    mainSeriesRef.current = mainSeries;

    // ── Indicator overlays (pane 0) ───────────────────────────────────────

    const closes = ohlcv.map(d => d.close);
    const times  = ohlcv.map(d => d.time);

    const toLineData = (vals: (number | null)[]) =>
      vals
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean) as { time: Time; value: number }[];

    if (indicators.sma20) {
      const s = chart.addSeries(LineSeries, { color: '#FF9800', lineWidth: 1, title: 'SMA20' });
      s.setData(toLineData(calcSMA(closes, 20)));
    }
    if (indicators.sma50) {
      const s = chart.addSeries(LineSeries, { color: '#9C27B0', lineWidth: 1, title: 'SMA50' });
      s.setData(toLineData(calcSMA(closes, 50)));
    }
    if (indicators.ema20) {
      const s = chart.addSeries(LineSeries, { color: '#00BCD4', lineWidth: 1, title: 'EMA20' });
      s.setData(toLineData(calcEMA(closes, 20)));
    }
    if (indicators.bbands) {
      const bb = calcBB(closes, 20);
      const upper  = chart.addSeries(LineSeries, { color: 'rgba(33,150,243,0.7)', lineWidth: 1, title: 'BB+' });
      const middle = chart.addSeries(LineSeries, { color: 'rgba(33,150,243,0.7)', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'BB~' });
      const lower  = chart.addSeries(LineSeries, { color: 'rgba(33,150,243,0.7)', lineWidth: 1, title: 'BB−' });
      const extract = (k: 'upper' | 'middle' | 'lower') =>
        bb.map((v, i) => v[k] !== null ? { time: times[i], value: v[k]! } : null)
          .filter(Boolean) as { time: Time; value: number }[];
      upper.setData(extract('upper'));
      middle.setData(extract('middle'));
      lower.setData(extract('lower'));
    }

    // ── Volume pane ───────────────────────────────────────────────────────

    if (indicators.volume) {
      const volPane = chart.addPane();
      volPane.setHeight(90);

      const volSeries = volPane.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volSeries.setData(
        ohlcv.map(({ time, close, open, volume }) => ({
          time,
          value: volume,
          color: close >= open ? c.volUp : c.volDown,
        })),
      );
    }

    // ── RSI pane ──────────────────────────────────────────────────────────

    if (indicators.rsi) {
      const rsiPane = chart.addPane();
      rsiPane.setHeight(90);

      const rsiSeries = rsiPane.addSeries(LineSeries, {
        color:     '#E91E63',
        lineWidth: 1,
        title:     'RSI',
        priceScaleId: '',
      });
      rsiSeries.setData(toLineData(calcRSI(closes, 14)));

      rsiSeries.createPriceLine({ price: 70, color: '#ef5350', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '' });
      rsiSeries.createPriceLine({ price: 50, color: c.crosshair, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: '' });
      rsiSeries.createPriceLine({ price: 30, color: '#26a69a', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '' });
    }

    // ── Crosshair legend ──────────────────────────────────────────────────

    const barMap = new Map(ohlcv.map(b => [b.time, b]));

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData.size) {
        setLegend(null);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = param.seriesData.get(mainSeries) as any;
      if (!d) { setLegend(null); return; }

      const fullBar = barMap.get(param.time as Time);
      if (chartType === 'candlestick' || chartType === 'bar') {
        setLegend({
          time:   param.time as Time,
          open:   d.open,
          high:   d.high,
          low:    d.low,
          close:  d.close,
          volume: fullBar?.volume ?? 0,
        });
      } else {
        setLegend({
          time:   param.time as Time,
          open:   d.value,
          high:   d.value,
          low:    d.value,
          close:  d.value,
          volume: fullBar?.volume ?? 0,
        });
      }
    });

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current    = null;
      mainSeriesRef.current = null;
    };
  }, [ohlcv, chartType, indicators, dark, timeframe.seconds]);

  // ── Live price simulation ─────────────────────────────────────────────────

  useEffect(() => {
    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    if (!live) return;

    let lastBar = { ...ohlcv[ohlcv.length - 1] };
    const rand = makeRng(Date.now() >>> 0);
    const vol = symbol.volatility;

    liveTimerRef.current = setInterval(() => {
      if (!mainSeriesRef.current) return;

      const ret = (rand() - 0.5) * vol * 0.4;
      const newClose = +(lastBar.close * (1 + ret)).toFixed(2);
      const newHigh  = +Math.max(lastBar.high,  newClose).toFixed(2);
      const newLow   = +Math.min(lastBar.low,   newClose).toFixed(2);

      const updated = { ...lastBar, close: newClose, high: newHigh, low: newLow };
      lastBar = updated;

      if (chartType === 'candlestick' || chartType === 'bar') {
        mainSeriesRef.current.update({ time: updated.time, open: updated.open, high: updated.high, low: updated.low, close: updated.close });
      } else {
        mainSeriesRef.current.update({ time: updated.time, value: updated.close });
      }
    }, 800);

    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [live, ohlcv, symbol.volatility, chartType]);

  const toggleIndicator = useCallback((key: keyof Indicators) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const displayBar = legend ?? ohlcv[ohlcv.length - 1];
  const { chg, pct, up: isUp } = fmtChange(displayBar.open, displayBar.close);

  const activeIndicatorCount =
    (indicators.sma20 ? 1 : 0) +
    (indicators.sma50 ? 1 : 0) +
    (indicators.ema20 ? 1 : 0) +
    (indicators.bbands ? 1 : 0) +
    (indicators.rsi ? 1 : 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-background overflow-hidden select-none">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-card shrink-0 overflow-x-auto scrollbar-none">

        {/* Symbol picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 font-bold text-sm shrink-0 h-8">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              {symbol.symbol}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-xs">Stocks</DropdownMenuLabel>
            {SYMBOLS.filter(s => !s.isCrypto).map(s => (
              <DropdownMenuItem
                key={s.symbol}
                onClick={() => setSymbol(s)}
                className={cn('gap-2', s.symbol === symbol.symbol && 'text-primary')}
              >
                <span className="font-mono font-semibold w-12 text-sm">{s.symbol}</span>
                <span className="text-muted-foreground text-xs truncate">{s.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Crypto</DropdownMenuLabel>
            {SYMBOLS.filter(s => s.isCrypto).map(s => (
              <DropdownMenuItem
                key={s.symbol}
                onClick={() => setSymbol(s)}
                className={cn('gap-2', s.symbol === symbol.symbol && 'text-primary')}
              >
                <span className="font-mono font-semibold w-12 text-sm">{s.symbol}</span>
                <span className="text-muted-foreground text-xs truncate">{s.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Price + change */}
        <div className="flex items-baseline gap-1.5 shrink-0 min-w-0">
          <span className={cn('font-mono font-bold text-sm', isUp ? 'text-emerald-500' : 'text-red-500')}>
            ${fmtPrice(displayBar.close)}
          </span>
          <span className={cn('text-xs font-medium hidden sm:block', isUp ? 'text-emerald-500' : 'text-red-500')}>
            {chg} ({pct})
          </span>
          {(chartType === 'candlestick' || chartType === 'bar') && (
            <span className="text-xs text-muted-foreground hidden md:flex gap-2">
              <span>O <span className="text-foreground">{fmtPrice(displayBar.open)}</span></span>
              <span>H <span className="text-emerald-500">{fmtPrice(displayBar.high)}</span></span>
              <span>L <span className="text-red-500">{fmtPrice(displayBar.low)}</span></span>
              {displayBar.volume > 0 && (
                <span>Vol <span className="text-foreground">{fmtVol(displayBar.volume)}</span></span>
              )}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Live button */}
        <Button
          variant={live ? 'default' : 'ghost'}
          size="sm"
          className={cn('h-7 px-2 gap-1 shrink-0 text-xs', live && 'text-emerald-100')}
          onClick={() => setLive(v => !v)}
          title="Simulate live price updates"
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', live ? 'bg-emerald-300 animate-pulse' : 'bg-muted-foreground')} />
          Live
        </Button>

        {/* Timeframes */}
        <div className="flex gap-0.5 shrink-0">
          {TIMEFRAMES.map(tf => (
            <Button
              key={tf.label}
              variant={timeframe.label === tf.label ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs font-medium"
              onClick={() => setTimeframe(tf)}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Chart types */}
        <div className="flex gap-0.5 shrink-0">
          {CHART_TYPES.map(({ type, label, icon }) => (
            <Button
              key={type}
              variant={chartType === type ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-sm"
              title={label}
              onClick={() => setChartType(type)}
            >
              {icon}
            </Button>
          ))}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Indicators */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={activeIndicatorCount > 0 ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2 gap-1 shrink-0 text-xs">
              <Layers className="h-3.5 w-3.5" />
              Indicators
              {activeIndicatorCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeIndicatorCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Moving Averages</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={indicators.sma20}
              onCheckedChange={() => toggleIndicator('sma20')}
            >
              <span className="flex-1">SMA 20</span>
              <span className="text-xs ml-2" style={{ color: '#FF9800' }}>●</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={indicators.sma50}
              onCheckedChange={() => toggleIndicator('sma50')}
            >
              <span className="flex-1">SMA 50</span>
              <span className="text-xs ml-2" style={{ color: '#9C27B0' }}>●</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={indicators.ema20}
              onCheckedChange={() => toggleIndicator('ema20')}
            >
              <span className="flex-1">EMA 20</span>
              <span className="text-xs ml-2" style={{ color: '#00BCD4' }}>●</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Bands</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={indicators.bbands}
              onCheckedChange={() => toggleIndicator('bbands')}
            >
              <span className="flex-1">Bollinger Bands (20,2)</span>
              <span className="text-xs ml-2" style={{ color: '#2196F3' }}>●</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Oscillators</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={indicators.rsi}
              onCheckedChange={() => toggleIndicator('rsi')}
            >
              <span className="flex-1">RSI (14)</span>
              <span className="text-xs ml-2" style={{ color: '#E91E63' }}>●</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Volume</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={indicators.volume}
              onCheckedChange={() => toggleIndicator('volume')}
            >
              Volume
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Active indicator chips ────────────────────────────────────────── */}
      {activeIndicatorCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-card border-b border-border shrink-0 overflow-x-auto scrollbar-none">
          {indicators.sma20  && <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 border-[#FF9800]/60" style={{ color: '#FF9800' }}>SMA 20</Badge>}
          {indicators.sma50  && <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 border-[#9C27B0]/60" style={{ color: '#9C27B0' }}>SMA 50</Badge>}
          {indicators.ema20  && <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 border-[#00BCD4]/60" style={{ color: '#00BCD4' }}>EMA 20</Badge>}
          {indicators.bbands && <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 border-[#2196F3]/60" style={{ color: '#2196F3' }}>BB(20,2)</Badge>}
          {indicators.rsi    && <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 border-[#E91E63]/60" style={{ color: '#E91E63' }}>RSI(14)</Badge>}
          <button
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            onClick={() => setIndicators(p => ({ ...p, sma20: false, sma50: false, ema20: false, bbands: false, rsi: false }))}
          >
            <RefreshCw className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* ── Chart canvas ─────────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 min-h-0" />

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-1 border-t border-border bg-card text-[10px] text-muted-foreground shrink-0">
        <span className="font-mono">{symbol.symbol} · {symbol.name}</span>
        <span>·</span>
        <span>{timeframe.label} chart</span>
        <span>·</span>
        <span>{ohlcv.length} bars</span>
        {live && (
          <>
            <span>·</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live simulation
            </span>
          </>
        )}
        <span className="ml-auto">Powered by TradingView Lightweight Charts™</span>
      </div>
    </div>
  );
}
