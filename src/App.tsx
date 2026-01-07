import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { SwipeNavigation } from "@/components/mobile/SwipeNavigation";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all page components for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Performance = lazy(() => import("./pages/Performance"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Settings = lazy(() => import("./pages/Settings"));

const OptionsPortfolio = lazy(() => import("./pages/OptionsPortfolio"));
const ZeroDTE = lazy(() => import("./pages/ZeroDTE"));
const Auth = lazy(() => import("./pages/Auth"));
const TradingToolkit = lazy(() => import("./pages/TradingToolkit"));
const MarketScanner = lazy(() => import("./pages/MarketScanner"));
const Reports = lazy(() => import("./pages/Reports"));
const CreditOptionsGuide = lazy(() => import("./pages/CreditOptionsGuide"));
const FundamentalAnalysisGuide = lazy(() => import("./pages/FundamentalAnalysisGuide"));

const DividendTracker = lazy(() => import("./pages/DividendTracker"));
const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const RiskMetrics = lazy(() => import("./pages/RiskMetrics"));
const PortfolioRebalancing = lazy(() => import("./pages/PortfolioRebalancing"));
const TradingViewWebhook = lazy(() => import("./pages/TradingViewWebhook"));
const TradingAutomation = lazy(() => import("./pages/TradingAutomation"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Install = lazy(() => import("./pages/Install"));
const StockResearch = lazy(() => import("./pages/StockResearch"));
const RetirementPlanning = lazy(() => import("./pages/RetirementPlanning"));
const SavedData = lazy(() => import("./pages/SavedData"));
const RealEstate = lazy(() => import("./pages/RealEstate"));
const CarFinance = lazy(() => import("./pages/CarFinance"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-8 safe-area-top">
    <div className="space-y-4">
      <Skeleton className="h-8 w-32 sm:w-48" />
      <Skeleton className="h-4 w-full max-w-96" />
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        <Skeleton className="h-24 sm:h-32" />
        <Skeleton className="h-24 sm:h-32" />
        <Skeleton className="h-24 sm:h-32 hidden sm:block" />
        <Skeleton className="h-24 sm:h-32 hidden lg:block" />
      </div>
      <Skeleton className="h-48 sm:h-64 mt-6" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SwipeNavigation>
          <div className="pb-16 lg:pb-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/trading-toolkit" element={<TradingToolkit />} />
                
                <Route path="/options-portfolio" element={<OptionsPortfolio />} />
                <Route path="/zero-dte" element={<ZeroDTE />} />
                <Route path="/market-scanner" element={<MarketScanner />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/credit-options-guide" element={<CreditOptionsGuide />} />
                <Route path="/fundamental-analysis-guide" element={<FundamentalAnalysisGuide />} />
                
                <Route path="/dividend-tracker" element={<DividendTracker />} />
                <Route path="/economic-calendar" element={<EconomicCalendar />} />
                <Route path="/risk-metrics" element={<RiskMetrics />} />
                <Route path="/portfolio-rebalancing" element={<PortfolioRebalancing />} />
                <Route path="/tradingview-webhook" element={<TradingViewWebhook />} />
                <Route path="/trading-automation" element={<TradingAutomation />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/install" element={<Install />} />
                <Route path="/stock-research" element={<StockResearch />} />
                <Route path="/retirement-planning" element={<RetirementPlanning />} />
                <Route path="/saved-data" element={<SavedData />} />
                <Route path="/real-estate" element={<RealEstate />} />
                <Route path="/car-finance" element={<CarFinance />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </SwipeNavigation>
        <FloatingActionButton />
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
