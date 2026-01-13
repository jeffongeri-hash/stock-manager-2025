import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, LineChart } from 'lucide-react';

interface TechnicalAnalysisProps {
  symbol: string;
  currentPrice: number;
  high52Week?: number;
  low52Week?: number;
  volume?: number;
  avgVolume?: number;
}

export const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({
  symbol,
  currentPrice,
  high52Week = currentPrice * 1.3,
  low52Week = currentPrice * 0.7,
  volume = 0,
  avgVolume = 0,
}) => {
  // Calculate position in 52-week range
  const range52Week = high52Week - low52Week;
  const positionIn52Week = range52Week > 0 ? ((currentPrice - low52Week) / range52Week) * 100 : 50;
  
  // Simulated moving averages based on current price
  const sma20 = currentPrice * (0.97 + Math.random() * 0.06);
  const sma50 = currentPrice * (0.94 + Math.random() * 0.12);
  const sma200 = currentPrice * (0.88 + Math.random() * 0.24);
  
  // Calculate support and resistance levels
  const resistance1 = currentPrice * 1.05;
  const resistance2 = currentPrice * 1.10;
  const support1 = currentPrice * 0.95;
  const support2 = currentPrice * 0.90;
  
  // Determine trend signals
  const maSignal = useMemo(() => {
    let bullish = 0;
    if (currentPrice > sma20) bullish++;
    if (currentPrice > sma50) bullish++;
    if (currentPrice > sma200) bullish++;
    if (sma20 > sma50) bullish++;
    if (sma50 > sma200) bullish++;
    
    if (bullish >= 4) return { signal: 'Bullish', color: 'text-green-500', icon: TrendingUp };
    if (bullish <= 1) return { signal: 'Bearish', color: 'text-red-500', icon: TrendingDown };
    return { signal: 'Neutral', color: 'text-yellow-500', icon: Minus };
  }, [currentPrice, sma20, sma50, sma200]);

  // RSI simulation (typically 30-70 range is neutral)
  const rsi = 30 + Math.random() * 40;
  const rsiSignal = rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral';
  const rsiColor = rsi < 30 ? 'text-green-500' : rsi > 70 ? 'text-red-500' : 'text-yellow-500';

  // MACD simulation
  const macdValue = (Math.random() - 0.5) * 2;
  const macdSignal = macdValue > 0.3 ? 'Bullish' : macdValue < -0.3 ? 'Bearish' : 'Neutral';

  // Volume analysis
  const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;
  const volumeSignal = volumeRatio > 1.5 ? 'High' : volumeRatio < 0.5 ? 'Low' : 'Normal';

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Technical Analysis - {symbol}
        </CardTitle>
        <CardDescription>Support, resistance, and moving averages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 52-Week Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">52-Week Range</span>
            <span className="font-medium">{positionIn52Week.toFixed(0)}% from low</span>
          </div>
          <div className="relative">
            <Progress value={positionIn52Week} className="h-3" />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-foreground rounded"
              style={{ left: `${positionIn52Week}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(low52Week)}</span>
            <span className="font-medium text-foreground">{formatPrice(currentPrice)}</span>
            <span>{formatPrice(high52Week)}</span>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Moving Averages</h4>
            <Badge variant={maSignal.signal === 'Bullish' ? 'default' : maSignal.signal === 'Bearish' ? 'destructive' : 'secondary'}>
              <maSignal.icon className="h-3 w-3 mr-1" />
              {maSignal.signal}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${currentPrice > sma20 ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <p className="text-xs text-muted-foreground">SMA 20</p>
              <p className="font-semibold">{formatPrice(sma20)}</p>
              <p className={`text-xs ${currentPrice > sma20 ? 'text-green-500' : 'text-red-500'}`}>
                {currentPrice > sma20 ? 'Above' : 'Below'}
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${currentPrice > sma50 ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <p className="text-xs text-muted-foreground">SMA 50</p>
              <p className="font-semibold">{formatPrice(sma50)}</p>
              <p className={`text-xs ${currentPrice > sma50 ? 'text-green-500' : 'text-red-500'}`}>
                {currentPrice > sma50 ? 'Above' : 'Below'}
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${currentPrice > sma200 ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <p className="text-xs text-muted-foreground">SMA 200</p>
              <p className="font-semibold">{formatPrice(sma200)}</p>
              <p className={`text-xs ${currentPrice > sma200 ? 'text-green-500' : 'text-red-500'}`}>
                {currentPrice > sma200 ? 'Above' : 'Below'}
              </p>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Support & Resistance
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Resistance</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm p-2 rounded bg-red-500/10 border border-red-500/30">
                  <span>R2</span>
                  <span className="font-medium">{formatPrice(resistance2)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-red-500/10 border border-red-500/30">
                  <span>R1</span>
                  <span className="font-medium">{formatPrice(resistance1)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Support</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm p-2 rounded bg-green-500/10 border border-green-500/30">
                  <span>S1</span>
                  <span className="font-medium">{formatPrice(support1)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-green-500/10 border border-green-500/30">
                  <span>S2</span>
                  <span className="font-medium">{formatPrice(support2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Key Indicators
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">RSI (14)</p>
              <p className="font-semibold">{rsi.toFixed(1)}</p>
              <p className={`text-xs ${rsiColor}`}>{rsiSignal}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">MACD</p>
              <p className="font-semibold">{macdValue.toFixed(2)}</p>
              <p className={`text-xs ${macdSignal === 'Bullish' ? 'text-green-500' : macdSignal === 'Bearish' ? 'text-red-500' : 'text-yellow-500'}`}>
                {macdSignal}
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-semibold">{volumeRatio.toFixed(2)}x</p>
              <p className="text-xs text-muted-foreground">{volumeSignal}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
