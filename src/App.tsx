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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEOHead } from "@/hooks/useSEO";

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
const OptionsGuide = lazy(() => import("./pages/OptionsGuide"));

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
const ETFComparison = lazy(() => import("./pages/ETFComparison"));
const Assets = lazy(() => import("./pages/Assets"));

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
        <SEOHead />
        <SwipeNavigation>
          <div className="pb-16 lg:pb-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                
                {/* Protected routes - allow guest mode */}
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
                <Route path="/trading-toolkit" element={<ProtectedRoute><TradingToolkit /></ProtectedRoute>} />
                <Route path="/options-portfolio" element={<ProtectedRoute><OptionsPortfolio /></ProtectedRoute>} />
                <Route path="/zero-dte" element={<ProtectedRoute><ZeroDTE /></ProtectedRoute>} />
                <Route path="/market-scanner" element={<ProtectedRoute><MarketScanner /></ProtectedRoute>} />
                <Route path="/credit-options-guide" element={<ProtectedRoute><CreditOptionsGuide /></ProtectedRoute>} />
                <Route path="/fundamental-analysis-guide" element={<ProtectedRoute><FundamentalAnalysisGuide /></ProtectedRoute>} />
                <Route path="/options-guide" element={<ProtectedRoute><OptionsGuide /></ProtectedRoute>} />
                <Route path="/dividend-tracker" element={<ProtectedRoute><DividendTracker /></ProtectedRoute>} />
                <Route path="/economic-calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} />
                <Route path="/risk-metrics" element={<ProtectedRoute><RiskMetrics /></ProtectedRoute>} />
                <Route path="/portfolio-rebalancing" element={<ProtectedRoute><PortfolioRebalancing /></ProtectedRoute>} />
                <Route path="/stock-research" element={<ProtectedRoute><StockResearch /></ProtectedRoute>} />
                <Route path="/retirement-planning" element={<ProtectedRoute><RetirementPlanning /></ProtectedRoute>} />
                <Route path="/real-estate" element={<ProtectedRoute><RealEstate /></ProtectedRoute>} />
                <Route path="/car-finance" element={<ProtectedRoute><CarFinance /></ProtectedRoute>} />
                <Route path="/etf-comparison" element={<ProtectedRoute><ETFComparison /></ProtectedRoute>} />
                <Route path="/assets" element={<ProtectedRoute requiresAuth><Assets /></ProtectedRoute>} />
                
                {/* Routes requiring full authentication */}
                <Route path="/settings" element={<ProtectedRoute requiresAuth><Settings /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiresAuth><Reports /></ProtectedRoute>} />
                <Route path="/tradingview-webhook" element={<ProtectedRoute requiresAuth><TradingViewWebhook /></ProtectedRoute>} />
                <Route path="/trading-automation" element={<ProtectedRoute requiresAuth><TradingAutomation /></ProtectedRoute>} />
                <Route path="/watchlist" element={<ProtectedRoute requiresAuth><Watchlist /></ProtectedRoute>} />
                <Route path="/saved-data" element={<ProtectedRoute requiresAuth><SavedData /></ProtectedRoute>} />
                
                {/* Catch-all route */}
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
