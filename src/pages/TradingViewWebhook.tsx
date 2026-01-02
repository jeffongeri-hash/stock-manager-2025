import React, { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, BarChart3, Settings, Maximize2, Minimize2 } from 'lucide-react';

const TradingViewWebhook = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [interval, setInterval] = useState('D');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check system theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (chartContainerRef.current) {
      // Clear previous widget
      chartContainerRef.current.innerHTML = '';

      // Create TradingView widget
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: "America/New_York",
        theme: theme,
        style: "1",
        locale: "en",
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true,
        show_popup_button: true,
        popup_width: "1000",
        popup_height: "650",
        support_host: "https://www.tradingview.com"
      });

      const container = document.createElement('div');
      container.className = 'tradingview-widget-container';
      container.style.height = '100%';
      container.style.width = '100%';

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      widgetContainer.style.height = 'calc(100% - 32px)';
      widgetContainer.style.width = '100%';

      container.appendChild(widgetContainer);
      container.appendChild(script);
      chartContainerRef.current.appendChild(container);
    }
  }, [symbol, interval, theme]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const popularSymbols = [
    { value: 'SPY', label: 'SPY - S&P 500 ETF' },
    { value: 'QQQ', label: 'QQQ - Nasdaq 100 ETF' },
    { value: 'AAPL', label: 'AAPL - Apple' },
    { value: 'MSFT', label: 'MSFT - Microsoft' },
    { value: 'NVDA', label: 'NVDA - NVIDIA' },
    { value: 'TSLA', label: 'TSLA - Tesla' },
    { value: 'AMZN', label: 'AMZN - Amazon' },
    { value: 'GOOGL', label: 'GOOGL - Google' },
    { value: 'META', label: 'META - Meta' },
    { value: 'AMD', label: 'AMD - AMD' },
  ];

  const intervals = [
    { value: '1', label: '1 Minute' },
    { value: '5', label: '5 Minutes' },
    { value: '15', label: '15 Minutes' },
    { value: '30', label: '30 Minutes' },
    { value: '60', label: '1 Hour' },
    { value: '240', label: '4 Hours' },
    { value: 'D', label: 'Daily' },
    { value: 'W', label: 'Weekly' },
    { value: 'M', label: 'Monthly' },
  ];

  return (
    <PageLayout title="TradingView Charts">
      <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
        {/* Controls */}
        <Card className={isFullscreen ? 'mb-2' : ''}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Symbol</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {popularSymbols.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">or</span>
                <Input 
                  placeholder="Enter symbol..."
                  className="w-32"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervals.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Theme</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark')}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="icon" onClick={toggleFullscreen} className="ml-auto">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TradingView Chart */}
        <Card className={isFullscreen ? 'flex-1' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {symbol} Chart
            </CardTitle>
            <CardDescription>
              Interactive TradingView chart with full technical analysis tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={chartContainerRef} 
              className={`w-full rounded-lg overflow-hidden ${isFullscreen ? 'h-[calc(100vh-220px)]' : 'h-[600px]'}`}
            />
          </CardContent>
        </Card>

        {/* Quick Access Tabs */}
        {!isFullscreen && (
          <Tabs defaultValue="market-overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="market-overview">Market Overview</TabsTrigger>
              <TabsTrigger value="screener">Stock Screener</TabsTrigger>
              <TabsTrigger value="heatmap">Market Heatmap</TabsTrigger>
            </TabsList>

            <TabsContent value="market-overview">
              <Card>
                <CardContent className="py-4">
                  <div className="h-[400px]" id="market-overview-widget">
                    <iframe 
                      src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22${theme}%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3Afalse%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22plotLineColorGrowing%22%3A%22rgba(41%2C%20191%2C%20141%2C%201)%22%2C%22plotLineColorFalling%22%3A%22rgba(255%2C%2053%2C%2053%2C%201)%22%2C%22gridLineColor%22%3A%22rgba(240%2C%20243%2C%20250%2C%200)%22%2C%22scaleFontColor%22%3A%22rgba(120%2C%20123%2C%20134%2C%201)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(41%2C%20191%2C%20141%2C%200.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(255%2C%2053%2C%2053%2C%200.12)%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba(41%2C%20191%2C%20141%2C%200)%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba(255%2C%2053%2C%2053%2C%200)%22%2C%22symbolActiveColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FOREXCOM%3ASPXUSD%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22d%22%3A%22Nasdaq%20100%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ADJI%22%2C%22d%22%3A%22Dow%2030%22%7D%5D%7D%2C%7B%22title%22%3A%22Commodities%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22CME_MINI%3AES1!%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22CME%3A6E1!%22%2C%22d%22%3A%22Euro%22%7D%2C%7B%22s%22%3A%22COMEX%3AGC1!%22%2C%22d%22%3A%22Gold%22%7D%2C%7B%22s%22%3A%22NYMEX%3ACL1!%22%2C%22d%22%3A%22Crude%20Oil%22%7D%5D%7D%5D%7D`}
                      className="w-full h-full border-0"
                      title="Market Overview"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screener">
              <Card>
                <CardContent className="py-4">
                  <div className="h-[500px]">
                    <iframe 
                      src={`https://s.tradingview.com/embed-widget/screener/?locale=en#%7B%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22defaultColumn%22%3A%22overview%22%2C%22defaultScreen%22%3A%22most_capitalized%22%2C%22market%22%3A%22america%22%2C%22showToolbar%22%3Atrue%2C%22colorTheme%22%3A%22${theme}%22%2C%22isTransparent%22%3Afalse%7D`}
                      className="w-full h-full border-0"
                      title="Stock Screener"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heatmap">
              <Card>
                <CardContent className="py-4">
                  <div className="h-[500px]">
                    <iframe 
                      src={`https://s.tradingview.com/embed-widget/stock-heatmap/?locale=en#%7B%22exchanges%22%3A%5B%5D%2C%22dataSource%22%3A%22SPX500%22%2C%22grouping%22%3A%22sector%22%2C%22blockSize%22%3A%22market_cap_basic%22%2C%22blockColor%22%3A%22change%22%2C%22symbolUrl%22%3A%22%22%2C%22colorTheme%22%3A%22${theme}%22%2C%22hasTopBar%22%3Atrue%2C%22isDataSet498%22%3Atrue%2C%22isZoomEnabled%22%3Atrue%2C%22hasSymbolTooltip%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D`}
                      className="w-full h-full border-0"
                      title="Market Heatmap"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageLayout>
  );
};

export default TradingViewWebhook;
