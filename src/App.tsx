
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import Performance from "./pages/Performance";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import ExpectedMove from "./pages/ExpectedMove";
import OptionsPortfolio from "./pages/OptionsPortfolio";
import ZeroDTE from "./pages/ZeroDTE";
import Fundamentals from "./pages/Fundamentals";
import Auth from "./pages/Auth";
import TradingToolkit from "./pages/TradingToolkit";
import TradeJournal from "./pages/TradeJournal";
import Backtesting from "./pages/Backtesting";
import TradeIdeas from "./pages/TradeIdeas";
import MarketScanner from "./pages/MarketScanner";
import Reports from "./pages/Reports";
import CreditOptionsGuide from "./pages/CreditOptionsGuide";
import FundamentalAnalysisGuide from "./pages/FundamentalAnalysisGuide";
import AlertHistory from "./pages/AlertHistory";
import TradeAssistant from "./pages/TradeAssistant";
import SectorHeatmap from "./pages/SectorHeatmap";
import DividendTracker from "./pages/DividendTracker";
import EconomicCalendar from "./pages/EconomicCalendar";
import CorrelationMatrix from "./pages/CorrelationMatrix";
import RiskMetrics from "./pages/RiskMetrics";
import MarketNews from "./pages/MarketNews";
import PortfolioRebalancing from "./pages/PortfolioRebalancing";
import TradingViewWebhook from "./pages/TradingViewWebhook";
import TradingAutomation from "./pages/TradingAutomation";
import Watchlist from "./pages/Watchlist";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="pb-16 lg:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trading-toolkit" element={<TradingToolkit />} />
            <Route path="/expected-move" element={<ExpectedMove />} />
            <Route path="/options-portfolio" element={<OptionsPortfolio />} />
            <Route path="/zero-dte" element={<ZeroDTE />} />
            <Route path="/fundamentals" element={<Fundamentals />} />
            <Route path="/trade-journal" element={<TradeJournal />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/trade-ideas" element={<TradeIdeas />} />
            <Route path="/market-scanner" element={<MarketScanner />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/credit-options-guide" element={<CreditOptionsGuide />} />
            <Route path="/fundamental-analysis-guide" element={<FundamentalAnalysisGuide />} />
            <Route path="/alert-history" element={<AlertHistory />} />
            <Route path="/trade-assistant" element={<TradeAssistant />} />
            <Route path="/sector-heatmap" element={<SectorHeatmap />} />
            <Route path="/dividend-tracker" element={<DividendTracker />} />
            <Route path="/economic-calendar" element={<EconomicCalendar />} />
            <Route path="/correlation-matrix" element={<CorrelationMatrix />} />
            <Route path="/risk-metrics" element={<RiskMetrics />} />
            <Route path="/market-news" element={<MarketNews />} />
            <Route path="/portfolio-rebalancing" element={<PortfolioRebalancing />} />
            <Route path="/tradingview-webhook" element={<TradingViewWebhook />} />
            <Route path="/trading-automation" element={<TradingAutomation />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
