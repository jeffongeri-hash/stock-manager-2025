import React, { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Clock, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Popular/common stock symbols
const COMMON_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Co.' },
  { symbol: 'BAC', name: 'Bank of America Corp.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'VZ', name: 'Verizon Communications' },
  { symbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'NKE', name: 'Nike Inc.' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
];

const STORAGE_KEY = 'ticker-search-history';
const MAX_HISTORY = 10;

interface TickerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (symbol: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

interface SearchHistoryItem {
  symbol: string;
  name?: string;
  timestamp: number;
}

export function TickerAutocomplete({
  value,
  onChange,
  onSelect,
  onKeyDown,
  label = "Stock Symbol",
  placeholder = "e.g. AAPL, TSLA, MSFT",
  showLabel = true,
  className = "",
  disabled = false,
  isLoading = false,
}: TickerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save to history when a symbol is selected
  const saveToHistory = useCallback((symbol: string, name?: string) => {
    const newItem: SearchHistoryItem = {
      symbol: symbol.toUpperCase(),
      name,
      timestamp: Date.now(),
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.symbol !== newItem.symbol);
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return updated;
    });
  }, []);

  // Filter suggestions based on input
  const suggestions = React.useMemo(() => {
    const query = value.toUpperCase().trim();
    
    if (!query) {
      // Show recent searches + popular stocks when empty
      const recent = searchHistory.slice(0, 5).map(h => ({
        symbol: h.symbol,
        name: h.name || COMMON_SYMBOLS.find(s => s.symbol === h.symbol)?.name || '',
        isRecent: true,
      }));
      
      const popularNotInRecent = COMMON_SYMBOLS
        .filter(s => !recent.find(r => r.symbol === s.symbol))
        .slice(0, 5)
        .map(s => ({ ...s, isRecent: false }));
      
      return [...recent, ...popularNotInRecent];
    }

    // Filter by symbol or name
    const matches = COMMON_SYMBOLS
      .filter(s => 
        s.symbol.includes(query) || 
        s.name.toUpperCase().includes(query)
      )
      .slice(0, 8)
      .map(s => ({ ...s, isRecent: false }));

    // Also include matching history items not in common symbols
    const historyMatches = searchHistory
      .filter(h => 
        h.symbol.includes(query) && 
        !matches.find(m => m.symbol === h.symbol)
      )
      .slice(0, 3)
      .map(h => ({
        symbol: h.symbol,
        name: h.name || '',
        isRecent: true,
      }));

    return [...historyMatches, ...matches];
  }, [value, searchHistory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  const handleSelect = (symbol: string, name?: string) => {
    onChange(symbol);
    saveToHistory(symbol, name);
    setIsOpen(false);
    setFocusedIndex(-1);
    onSelect?.(symbol);
    inputRef.current?.focus();
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      onKeyDown?.(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          e.preventDefault();
          const selected = suggestions[focusedIndex];
          handleSelect(selected.symbol, selected.name);
        } else {
          onKeyDown?.(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        onKeyDown?.(e);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on suggestions
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 200);
  };

  return (
    <div className={cn("relative", className)}>
      {showLabel && <Label className="mb-1.5 block">{label}</Label>}
      <div className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDownInternal}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-9"
          maxLength={10}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 py-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto"
        >
          {value.trim() === '' && searchHistory.length > 0 && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
              Recent Searches
            </div>
          )}
          {suggestions.map((suggestion, index) => {
            const isRecent = suggestion.isRecent;
            const showPopularHeader = !value.trim() && index === Math.min(searchHistory.length, 5) && index > 0;
            
            return (
              <React.Fragment key={suggestion.symbol}>
                {showPopularHeader && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium border-t border-border mt-1 pt-2">
                    Popular Stocks
                  </div>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-accent transition-colors",
                    focusedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelect(suggestion.symbol, suggestion.name)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {isRecent ? (
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{suggestion.symbol}</span>
                      {COMMON_SYMBOLS.slice(0, 10).find(s => s.symbol === suggestion.symbol) && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {suggestion.name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {suggestion.name}
                      </p>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
