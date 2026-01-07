import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TradeReturn {
  date: string;
  returnPct: number;
  pnl: number;
  symbol: string;
}

interface DailyReturn {
  date: string;
  dailyReturn: number;
  cumulativePnl: number;
}

interface PortfolioReturnsData {
  dailyReturns: DailyReturn[];
  tradeReturns: TradeReturn[];
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  calmarRatio: number;
  isLoading: boolean;
  hasRealData: boolean;
}

export const usePortfolioReturns = (riskFreeRate: number = 0.05): PortfolioReturnsData => {
  const { user } = useAuth();
  const [stockTrades, setStockTrades] = useState<any[]>([]);
  const [optionTrades, setOptionTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch stock trades (closed ones with exit date)
        const { data: stocks, error: stockError } = await supabase
          .from('stock_trades')
          .select('*')
          .not('exit_date', 'is', null)
          .order('exit_date', { ascending: true });

        if (stockError) throw stockError;

        // Fetch options trades
        const { data: options, error: optionsError } = await supabase
          .from('trades')
          .select('*')
          .order('date', { ascending: true });

        if (optionsError) throw optionsError;

        setStockTrades(stocks || []);
        setOptionTrades(options || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  const calculatedMetrics = useMemo(() => {
    const tradeReturns: TradeReturn[] = [];
    
    // Process stock trades
    stockTrades.forEach(trade => {
      if (trade.exit_price && trade.exit_date) {
        const entryValue = trade.entry_price * trade.quantity;
        const exitValue = trade.exit_price * trade.quantity;
        const pnl = exitValue - entryValue;
        const returnPct = ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100;
        
        tradeReturns.push({
          date: trade.exit_date,
          returnPct,
          pnl,
          symbol: trade.symbol
        });
      }
    });

    // Process options trades (using premium as P&L indicator)
    optionTrades.forEach(trade => {
      const pnl = trade.action === 'sell' ? trade.total_value : -trade.total_value;
      const returnPct = (pnl / Math.abs(trade.total_value)) * 100;
      
      tradeReturns.push({
        date: trade.date,
        returnPct: isFinite(returnPct) ? returnPct : 0,
        pnl,
        symbol: trade.symbol
      });
    });

    // Sort by date
    tradeReturns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const hasRealData = tradeReturns.length > 0;

    // If no real data, return default values
    if (!hasRealData) {
      return {
        dailyReturns: [],
        tradeReturns: [],
        annualizedReturn: 0,
        annualizedVolatility: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        totalPnL: 0,
        totalTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        calmarRatio: 0,
        hasRealData: false
      };
    }

    // Group trades by date for daily returns
    const dailyPnlMap = new Map<string, number>();
    tradeReturns.forEach(tr => {
      const current = dailyPnlMap.get(tr.date) || 0;
      dailyPnlMap.set(tr.date, current + tr.pnl);
    });

    // Calculate cumulative returns and daily returns
    let cumulativePnl = 0;
    const dailyReturns: DailyReturn[] = [];
    let runningCapital = 100000; // Assume starting capital

    dailyPnlMap.forEach((pnl, date) => {
      const dailyReturn = pnl / runningCapital;
      cumulativePnl += pnl;
      runningCapital += pnl;
      
      dailyReturns.push({
        date,
        dailyReturn,
        cumulativePnl
      });
    });

    // Calculate total P&L
    const totalPnL = tradeReturns.reduce((sum, t) => sum + t.pnl, 0);

    // Win/Loss statistics
    const winningTrades = tradeReturns.filter(t => t.pnl > 0);
    const losingTrades = tradeReturns.filter(t => t.pnl < 0);
    const winRate = (winningTrades.length / tradeReturns.length) * 100;
    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0;
    const averageLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;
    
    // Profit Factor = Gross Profit / Gross Loss
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Calculate annualized metrics
    const returns = dailyReturns.map(d => d.dailyReturn);
    
    if (returns.length < 2) {
      return {
        dailyReturns,
        tradeReturns,
        annualizedReturn: totalPnL > 0 ? 10 : -10, // Simple estimate
        annualizedVolatility: 20,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        totalPnL,
        totalTrades: tradeReturns.length,
        winRate,
        averageWin,
        averageLoss,
        profitFactor,
        calmarRatio: 0,
        hasRealData: true
      };
    }

    // Mean daily return
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Calculate trading days span
    const firstDate = new Date(dailyReturns[0].date);
    const lastDate = new Date(dailyReturns[dailyReturns.length - 1].date);
    const daySpan = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const tradingDaysPerYear = 252;
    const annualizationFactor = tradingDaysPerYear / Math.min(daySpan, tradingDaysPerYear);
    
    // Annualized return
    const annualizedReturn = meanReturn * annualizationFactor * 100;
    
    // Daily volatility (standard deviation)
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(tradingDaysPerYear) * 100;
    
    // Sharpe Ratio = (Annualized Return - Risk-Free Rate) / Annualized Volatility
    const sharpeRatio = annualizedVolatility > 0 
      ? (annualizedReturn / 100 - riskFreeRate) / (annualizedVolatility / 100)
      : 0;
    
    // Sortino Ratio (only uses downside volatility)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.length > 0
      ? downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(tradingDaysPerYear);
    const sortinoRatio = downsideDeviation > 0 
      ? (annualizedReturn / 100 - riskFreeRate) / downsideDeviation
      : sharpeRatio;
    
    // Maximum Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningValue = 100000;
    
    dailyReturns.forEach(d => {
      runningValue = runningValue * (1 + d.dailyReturn);
      if (runningValue > peak) {
        peak = runningValue;
      }
      const drawdown = (peak - runningValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calmar Ratio = Annualized Return / Max Drawdown
    const calmarRatio = maxDrawdown > 0 
      ? (annualizedReturn / 100) / maxDrawdown 
      : 0;

    return {
      dailyReturns,
      tradeReturns,
      annualizedReturn,
      annualizedVolatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown: maxDrawdown * 100,
      totalPnL,
      totalTrades: tradeReturns.length,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      calmarRatio,
      hasRealData: true
    };
  }, [stockTrades, optionTrades, riskFreeRate]);

  return {
    ...calculatedMetrics,
    isLoading
  };
};
