import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

interface TickerSearchProps {
  onStockData?: (data: StockData) => void;
  onPriceChange?: (price: number) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export function TickerSearch({
  onStockData,
  onPriceChange,
  label = "Search by Ticker Symbol",
  placeholder = "e.g. AAPL, TSLA, MSFT",
  showLabel = true,
  compact = false,
  className = "",
}: TickerSearchProps) {
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);

  const fetchStockPrice = useCallback(async (symbolOverride?: string) => {
    const symbolToFetch = symbolOverride || tickerSymbol.trim().toUpperCase();
    
    if (!symbolToFetch) {
      toast.error("Please enter a ticker symbol");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols: [symbolToFetch] }
      });

      if (error) throw error;

      if (data?.stocks && data.stocks.length > 0) {
        const stock = data.stocks[0];
        if (stock.price && stock.price > 0) {
          const stockInfo: StockData = {
            symbol: symbolToFetch,
            name: stock.name || symbolToFetch,
            price: parseFloat(stock.price.toFixed(2)),
            change: stock.change ?? null,
            changePercent: stock.changePercent ?? null,
            high: stock.high,
            low: stock.low,
            open: stock.open,
            previousClose: stock.previousClose,
          };
          
          setStockData(stockInfo);
          onStockData?.(stockInfo);
          onPriceChange?.(stockInfo.price);
          toast.success(`Loaded ${symbolToFetch} at $${stock.price.toFixed(2)}`);
        } else {
          toast.error(`No price data available for ${symbolToFetch}`);
        }
      } else {
        toast.error(`Could not find stock: ${symbolToFetch}`);
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
      toast.error("Failed to fetch stock price. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [tickerSymbol, onStockData, onPriceChange]);

  const handleRefresh = useCallback(() => {
    if (stockData?.symbol) {
      fetchStockPrice(stockData.symbol);
    }
  }, [stockData?.symbol, fetchStockPrice]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchStockPrice();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && <Label>{label}</Label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            value={tickerSymbol}
            onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9"
            maxLength={10}
          />
        </div>
        <Button 
          onClick={() => fetchStockPrice()} 
          disabled={isLoading || !tickerSymbol.trim()}
          size={compact ? "icon" : "default"}
          variant="default"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : compact ? (
            <Search className="h-4 w-4" />
          ) : (
            "Get Price"
          )}
        </Button>
        {stockData && (
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            size="icon"
            variant="outline"
            title="Refresh price"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
      
      {stockData && (
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{stockData.name}</span>
            <Badge variant="outline" className="text-xs">{stockData.symbol}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">${stockData.price.toFixed(2)}</span>
            {stockData.change !== null && stockData.changePercent !== null && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stockData.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stockData.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
