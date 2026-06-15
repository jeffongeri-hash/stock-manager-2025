import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { SwipeNavigation } from "@/components/mobile/SwipeNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SEOHead } from "@/hooks/useSEO";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";

// Lazy load all page components for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Performance = lazy(() => import("./pages/Performance"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Settings = lazy(() => import("./pages/Settings"));

const OptionsPortfolio = lazy(() => import("./pages/OptionsPortfolio"));
const ZeroDTE = lazy(() => import("./pages/ZeroDTE"));
const Auth = lazy(() => import("./pages/Auth"));
const TradingToolkit = lazy(() => import("./pages/TradingToolkit"));

const CreditOptionsGuide = lazy(() => import("./pages/CreditOptionsGuide"));
const FundamentalAnalysisGuide = lazy(() => import("./pages/FundamentalAnalysisGuide"));
const OptionsGuide = lazy(() => import("./pages/OptionsGuide"));

const DividendTracker = lazy(() => import("./pages/DividendTracker"));

const Install = lazy(() => import("./pages/Install"));

const RetirementPlanning = lazy(() => import("./pages/RetirementPlanning"));
const FireGuide = lazy(() => import("./pages/FireGuide"));
const SavedData = lazy(() => import("./pages/SavedData"));
const RealEstate = lazy(() => import("./pages/RealEstate"));
const CarFinance = lazy(() => import("./pages/CarFinance"));

const Assets = lazy(() => import("./pages/Assets"));

const SmartTradeAI = lazy(() => import("./pages/SmartTradeAI"));
const QuantGemini = lazy(() => import("./pages/QuantGemini"));

// Public SEO landing pages
const CoastFireTracker = lazy(() => import("./pages/CoastFireTracker"));
const CoastFireCalculator = lazy(() => import("./pages/CoastFireCalculator"));
const WhatIsCoastFire = lazy(() => import("./pages/WhatIsCoastFire"));
const FireForBeginners = lazy(() => import("./pages/FireForBeginners"));
const EarlyRetirementCalculator = lazy(() => import("./pages/EarlyRetirementCalculator"));
const FinancialIndependenceCalculator = lazy(() => import("./pages/FinancialIndependenceCalculator"));
const CoveredCallCalculator = lazy(() => import("./pages/CoveredCallCalculator"));
const MonthlyDividendCalculator = lazy(() => import("./pages/MonthlyDividendCalculator"));
const PaycheckCalculator = lazy(() => import("./pages/PaycheckCalculator"));
const AllTools = lazy(() => import("./pages/AllTools"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));

// AI-powered demo pages — admin-only while hidden from public launch.
const AiTradeJournal = lazy(() => import("./pages/AiTradeJournal"));
const AiTradeJournalDemo = lazy(() => import("./pages/AiTradeJournalDemo"));
const PremarketBrief = lazy(() => import("./pages/PremarketBrief"));
const WeeklyFundamentalScan = lazy(() => import("./pages/WeeklyFundamentalScan"));
const FirePlanningSuite = lazy(() => import("./pages/FirePlanningSuite"));

// Blog / explainer pages
const BlogPage = lazy(() => import("./pages/BlogPage"));
const IvStrikeSelector = lazy(() => import("./pages/IvStrikeSelector"));


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
      <PWAUpdateNotification />
      <BrowserRouter>
        <SEOHead />
        <SubscriptionBanner />
        <SwipeNavigation>
          <div className="pb-16 lg:pb-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/index" element={<Landing />} />
                <Route path="/dashboard" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />

                {/* Public SEO calculator landing pages */}
                <Route path="/coast-fire-tracker" element={<CoastFireTracker />} />
                <Route path="/coast-fire-calculator" element={<CoastFireCalculator />} />
                <Route path="/what-is-coast-fire" element={<WhatIsCoastFire />} />
                <Route path="/fire-for-beginners" element={<FireForBeginners />} />
                <Route path="/early-retirement-calculator" element={<EarlyRetirementCalculator />} />
                <Route path="/financial-independence-calculator" element={<FinancialIndependenceCalculator />} />
                <Route path="/covered-call-calculator" element={<CoveredCallCalculator />} />
                <Route path="/monthly-dividend-calculator" element={<MonthlyDividendCalculator />} />
                <Route path="/all-tools" element={<AllTools />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/paycheck-calculator" element={<AdminRoute><PaycheckCalculator /></AdminRoute>} />
                
                {/* Protected routes - allow guest mode */}
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/analysis" element={<AdminRoute><Analysis /></AdminRoute>} />
                <Route path="/trading-toolkit" element={<TradingToolkit />} />
                <Route path="/options-portfolio" element={<OptionsPortfolio />} />
                <Route path="/zero-dte" element={<ZeroDTE />} />
                <Route path="/market-scanner" element={<Navigate to="/portfolio" replace />} />
                <Route path="/credit-options-guide" element={<CreditOptionsGuide />} />
                <Route path="/fundamental-analysis-guide" element={<FundamentalAnalysisGuide />} />
                <Route path="/options-guide" element={<OptionsGuide />} />
                <Route path="/dividend-tracker" element={<DividendTracker />} />

                {/* Risk & Rebalance pages removed */}
                <Route path="/risk-metrics" element={<Navigate to="/portfolio" replace />} />
                <Route path="/portfolio-rebalancing" element={<Navigate to="/portfolio" replace />} />

                <Route path="/retirement-planning" element={<RetirementPlanning />} />
                <Route path="/fire-guide" element={<FireGuide />} />
                <Route path="/real-estate" element={<RealEstate />} />
                <Route path="/car-finance" element={<CarFinance />} />
                
                {/* AI-powered routes — admin-only (Gemini-backed, hidden until launch) */}
                <Route path="/smarttrade-ai" element={<AdminRoute><SmartTradeAI /></AdminRoute>} />
                <Route path="/quantgemini" element={<AdminRoute><QuantGemini /></AdminRoute>} />
                
                <Route path="/assets" element={<ProtectedRoute requiresAuth><Assets /></ProtectedRoute>} />
                
                {/* Routes requiring full authentication */}
                <Route path="/settings" element={<ProtectedRoute requiresAuth><Settings /></ProtectedRoute>} />
                <Route path="/ignite-fire" element={<Navigate to="/retirement-planning" replace />} />
                <Route path="/saved-data" element={<ProtectedRoute requiresAuth><SavedData /></ProtectedRoute>} />

                {/* AI-powered demo pages — admin-only (Gemini-backed) */}
                <Route path="/ai-trade-journal" element={<AdminRoute><AiTradeJournal /></AdminRoute>} />
                <Route path="/ai-trade-journal-demo" element={<AdminRoute><AiTradeJournalDemo /></AdminRoute>} />
                <Route path="/premarket-brief" element={<AdminRoute><PremarketBrief /></AdminRoute>} />
                <Route path="/weekly-fundamental-scan" element={<AdminRoute><WeeklyFundamentalScan /></AdminRoute>} />
                <Route path="/fire-planning-suite" element={<AdminRoute><FirePlanningSuite /></AdminRoute>} />

                {/* Blog explainer pages (public) */}
                <Route path="/blog/real-estate-car-finance-guide" element={<BlogPage src="/blog/real-estate-car-finance-guide.html" title="Real Estate & Car Finance Guide" />} />
                <Route path="/blog/covered-call-calculator-guide" element={<BlogPage src="/blog/covered-call-calculator-guide.html" title="Covered Call Calculator Guide" />} />

                {/* Admin-only — IV Strike Selector */}
                <Route path="/iv-strike-selector" element={<AdminRoute><IvStrikeSelector /></AdminRoute>} />

                
                
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
