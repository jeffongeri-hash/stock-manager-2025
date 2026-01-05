import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, Area, AreaChart, BarChart, Bar, ReferenceLine } from 'recharts';
import { Plus, X, Calculator, TrendingUp, Shield, Target, Grid3X3, Save, FolderOpen, Trash2, PlayCircle, Download, Loader2, AlertTriangle, BarChart3, DollarSign, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Historical stress scenarios based on actual market data
interface StressScenario {
  id: string;
  name: string;
  description: string;
  period: string;
  marketDrop: number; // S&P 500 decline
  volatilitySpike: number; // VIX spike multiplier
  correlationIncrease: number; // How much correlations increase toward 1
  durationMonths: number;
  recoveryMonths: number;
}

const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: '2008-financial',
    name: '2008 Financial Crisis',
    description: 'Lehman Brothers collapse, housing market crash, global banking crisis',
    period: 'Sep 2008 - Mar 2009',
    marketDrop: -56.8,
    volatilitySpike: 3.5,
    correlationIncrease: 0.85,
    durationMonths: 17,
    recoveryMonths: 49,
  },
  {
    id: '2020-covid',
    name: 'COVID-19 Crash',
    description: 'Global pandemic triggers fastest market decline in history',
    period: 'Feb 2020 - Mar 2020',
    marketDrop: -33.9,
    volatilitySpike: 4.0,
    correlationIncrease: 0.9,
    durationMonths: 1,
    recoveryMonths: 5,
  },
  {
    id: '2000-dotcom',
    name: 'Dot-Com Bubble',
    description: 'Tech bubble burst, NASDAQ lost 78% from peak',
    period: 'Mar 2000 - Oct 2002',
    marketDrop: -49.1,
    volatilitySpike: 2.0,
    correlationIncrease: 0.7,
    durationMonths: 30,
    recoveryMonths: 56,
  },
  {
    id: '2022-bear',
    name: '2022 Bear Market',
    description: 'Fed rate hikes, inflation surge, growth stock selloff',
    period: 'Jan 2022 - Oct 2022',
    marketDrop: -25.4,
    volatilitySpike: 1.8,
    correlationIncrease: 0.65,
    durationMonths: 10,
    recoveryMonths: 14,
  },
  {
    id: '1987-blackmonday',
    name: 'Black Monday 1987',
    description: 'Single-day crash of 22.6%, largest one-day decline',
    period: 'Oct 19, 1987',
    marketDrop: -33.5,
    volatilitySpike: 5.0,
    correlationIncrease: 0.95,
    durationMonths: 2,
    recoveryMonths: 20,
  },
  {
    id: 'custom-mild',
    name: 'Mild Correction',
    description: 'Typical 10-15% market correction',
    period: 'Hypothetical',
    marketDrop: -15,
    volatilitySpike: 1.5,
    correlationIncrease: 0.5,
    durationMonths: 3,
    recoveryMonths: 6,
  },
];

interface Preset {
  id: string;
  name: string;
  stocks: Stock[];
  correlationMatrix: number[][];
  riskTolerance: number;
  riskFreeRate: number;
  createdAt: string;
}

const PRESET_STORAGE_KEY = 'portfolio-optimizer-presets';

interface Stock {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  weight?: number;
  dividendYield?: number; // Annual dividend yield in %
}

interface CustomScenario {
  id: string;
  name: string;
  description: string;
  marketDrop: number;
  volatilitySpike: number;
  correlationIncrease: number;
  durationMonths: number;
  recoveryMonths: number;
}

interface YearlyIncome {
  year: number;
  dividendIncome: number;
  portfolioValue: number;
  cumulativeIncome: number;
  reinvestedValue?: number;
}

interface PortfolioPoint {
  risk: number;
  return: number;
  weights: number[];
  sharpe: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(25, 95%, 53%)'];

const DEFAULT_STOCKS: Stock[] = [
  { symbol: 'AAPL', expectedReturn: 12, volatility: 25, dividendYield: 0.5 },
  { symbol: 'GOOGL', expectedReturn: 15, volatility: 30, dividendYield: 0 },
  { symbol: 'MSFT', expectedReturn: 11, volatility: 22, dividendYield: 0.8 },
];

export const PortfolioOptimizer = () => {
  const [stocks, setStocks] = useState<Stock[]>(DEFAULT_STOCKS);
  const [newStock, setNewStock] = useState({ symbol: '', expectedReturn: '', volatility: '', dividendYield: '' });
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [riskFreeRate, setRiskFreeRate] = useState(4.5);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>(() => {
    // Initialize with default correlations
    const n = DEFAULT_STOCKS.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) matrix[i][j] = 1;
        else matrix[i][j] = 0.4;
      }
    }
    return matrix;
  });
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [presetName, setPresetName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  
  // Monte Carlo simulation state
  const [monteCarloYears, setMonteCarloYears] = useState(10);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState(1000);
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [monteCarloResults, setMonteCarloResults] = useState<{
    paths: number[][];
    percentiles: { year: number; p10: number; p25: number; p50: number; p75: number; p90: number }[];
    stats: { medianFinal: number; meanFinal: number; probabilityProfit: number; probabilityDoubling: number; maxDrawdown: number };
  } | null>(null);
  const [isRunningMonteCarlo, setIsRunningMonteCarlo] = useState(false);
  
  // Historical correlation import state
  const [isLoadingCorrelations, setIsLoadingCorrelations] = useState(false);
  const [correlationPeriod, setCorrelationPeriod] = useState('1y');
  
  // Stress testing state
  const [stressResults, setStressResults] = useState<{
    scenario: StressScenario;
    portfolioLoss: number;
    stressedValue: number;
    recoveryValue: number;
    maxDrawdown: number;
    monthlyPath: { month: number; value: number }[];
    assetImpacts: { symbol: string; loss: number; weight: number }[];
  }[] | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['2008-financial', '2020-covid']);
  const [isRunningStressTest, setIsRunningStressTest] = useState(false);
  
  // Custom stress scenario state
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);
  const [newCustomScenario, setNewCustomScenario] = useState<Partial<CustomScenario>>({
    name: '',
    description: '',
    marketDrop: -30,
    volatilitySpike: 2.5,
    correlationIncrease: 0.75,
    durationMonths: 6,
    recoveryMonths: 12,
  });
  const [showCustomScenarioBuilder, setShowCustomScenarioBuilder] = useState(false);
  
  // DRIP and income tracking state
  const [enableDRIP, setEnableDRIP] = useState(false);
  const [yearlyIncomeResults, setYearlyIncomeResults] = useState<YearlyIncome[] | null>(null);

  // Initialize correlation matrix when stocks change
  useEffect(() => {
    if (correlationMatrix.length !== stocks.length) {
      const n = stocks.length;
      const newMatrix: number[][] = [];
      for (let i = 0; i < n; i++) {
        newMatrix[i] = [];
        for (let j = 0; j < n; j++) {
          if (i === j) newMatrix[i][j] = 1;
          else if (correlationMatrix[i]?.[j] !== undefined) newMatrix[i][j] = correlationMatrix[i][j];
          else newMatrix[i][j] = 0.4;
        }
      }
      setCorrelationMatrix(newMatrix);
    }
  }, [stocks.length]);

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);
  // Update correlation matrix value (symmetric)
  const updateCorrelation = (i: number, j: number, value: number) => {
    const clampedValue = Math.max(-1, Math.min(1, value));
    const newMatrix = correlationMatrix.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === i && ci === j) return clampedValue;
        if (ri === j && ci === i) return clampedValue; // Mirror for symmetry
        return cell;
      })
    );
    setCorrelationMatrix(newMatrix);
  };

  // Preset management functions
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      stocks: stocks.map(s => ({ ...s })),
      correlationMatrix: correlationMatrix.map(row => [...row]),
      riskTolerance: riskTolerance[0],
      riskFreeRate,
      createdAt: new Date().toISOString(),
    };
    
    setPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setSaveDialogOpen(false);
    toast.success(`Saved preset "${newPreset.name}"`);
  };

  const loadPreset = (preset: Preset) => {
    setStocks(preset.stocks.map(s => ({ ...s })));
    setCorrelationMatrix(preset.correlationMatrix.map(row => [...row]));
    setRiskTolerance([preset.riskTolerance]);
    setRiskFreeRate(preset.riskFreeRate);
    setLoadDialogOpen(false);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = (id: string, name: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    toast.success(`Deleted preset "${name}"`);
  };

  // Run Monte Carlo simulation with dividends and DRIP
  const runMonteCarloSimulation = () => {
    if (!optimalPortfolio || stocks.length < 2) {
      toast.error('Need optimal portfolio to run simulation');
      return;
    }

    setIsRunningMonteCarlo(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const numSims = monteCarloSimulations;
      const years = monteCarloYears;
      const weights = optimalPortfolio.weights;
      const returns = stocks.map(s => s.expectedReturn / 100);
      const volatilities = stocks.map(s => s.volatility / 100);
      const dividendYields = stocks.map(s => (s.dividendYield || 0) / 100);
      
      // Calculate portfolio expected return and volatility
      const portfolioReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
      const portfolioDividendYield = weights.reduce((sum, w, i) => sum + w * dividendYields[i], 0);
      
      let portfolioVariance = 0;
      for (let i = 0; i < stocks.length; i++) {
        for (let j = 0; j < stocks.length; j++) {
          const corr = correlationMatrix[i]?.[j] ?? (i === j ? 1 : 0);
          portfolioVariance += weights[i] * weights[j] * volatilities[i] * volatilities[j] * corr;
        }
      }
      const portfolioVol = Math.sqrt(portfolioVariance);
      
      // Run simulations
      const paths: number[][] = [];
      const pathsWithDRIP: number[][] = [];
      const finalValues: number[] = [];
      const yearlyIncomeAcc: { [year: number]: { dividends: number[]; values: number[]; dripValues: number[] } } = {};
      
      for (let year = 0; year <= years; year++) {
        yearlyIncomeAcc[year] = { dividends: [], values: [], dripValues: [] };
      }
      
      for (let sim = 0; sim < numSims; sim++) {
        const path: number[] = [initialInvestment];
        const dripPath: number[] = [initialInvestment];
        let value = initialInvestment;
        let dripValue = initialInvestment;
        let cumulativeDividends = 0;
        
        yearlyIncomeAcc[0].values.push(value);
        yearlyIncomeAcc[0].dripValues.push(dripValue);
        yearlyIncomeAcc[0].dividends.push(0);
        
        for (let year = 1; year <= years; year++) {
          // Generate random return using normal distribution (Box-Muller)
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const yearReturn = portfolioReturn + portfolioVol * z;
          
          // Calculate dividend income for the year (based on value at start of year)
          const dividendIncome = value * portfolioDividendYield;
          cumulativeDividends += dividendIncome;
          
          // Update values
          value = value * (1 + yearReturn);
          
          // With DRIP: dividends are reinvested
          dripValue = dripValue * (1 + yearReturn + portfolioDividendYield);
          
          path.push(Math.max(0, value));
          dripPath.push(Math.max(0, dripValue));
          
          yearlyIncomeAcc[year].dividends.push(dividendIncome);
          yearlyIncomeAcc[year].values.push(value);
          yearlyIncomeAcc[year].dripValues.push(dripValue);
        }
        
        paths.push(path);
        pathsWithDRIP.push(dripPath);
        finalValues.push(enableDRIP ? dripPath[dripPath.length - 1] : path[path.length - 1]);
      }
      
      // Calculate percentiles for each year
      const percentiles: { year: number; p10: number; p25: number; p50: number; p75: number; p90: number }[] = [];
      
      for (let year = 0; year <= years; year++) {
        const yearValues = (enableDRIP ? pathsWithDRIP : paths).map(p => p[year]).sort((a, b) => a - b);
        percentiles.push({
          year,
          p10: yearValues[Math.floor(numSims * 0.1)],
          p25: yearValues[Math.floor(numSims * 0.25)],
          p50: yearValues[Math.floor(numSims * 0.5)],
          p75: yearValues[Math.floor(numSims * 0.75)],
          p90: yearValues[Math.floor(numSims * 0.9)],
        });
      }
      
      // Calculate yearly income results (median values)
      const yearlyIncome: YearlyIncome[] = [];
      let cumIncome = 0;
      for (let year = 0; year <= years; year++) {
        const sortedDivs = [...yearlyIncomeAcc[year].dividends].sort((a, b) => a - b);
        const sortedVals = [...yearlyIncomeAcc[year].values].sort((a, b) => a - b);
        const sortedDrip = [...yearlyIncomeAcc[year].dripValues].sort((a, b) => a - b);
        
        const medianDiv = sortedDivs[Math.floor(numSims * 0.5)] || 0;
        cumIncome += medianDiv;
        
        yearlyIncome.push({
          year,
          dividendIncome: medianDiv,
          portfolioValue: sortedVals[Math.floor(numSims * 0.5)],
          cumulativeIncome: cumIncome,
          reinvestedValue: sortedDrip[Math.floor(numSims * 0.5)],
        });
      }
      
      setYearlyIncomeResults(yearlyIncome);
      
      // Calculate statistics
      finalValues.sort((a, b) => a - b);
      const medianFinal = finalValues[Math.floor(numSims * 0.5)];
      const meanFinal = finalValues.reduce((a, b) => a + b, 0) / numSims;
      const probabilityProfit = finalValues.filter(v => v > initialInvestment).length / numSims * 100;
      const probabilityDoubling = finalValues.filter(v => v > initialInvestment * 2).length / numSims * 100;
      
      // Calculate max drawdown across all paths
      let maxDrawdown = 0;
      const pathsToCheck = enableDRIP ? pathsWithDRIP : paths;
      for (const path of pathsToCheck.slice(0, 100)) { // Sample for performance
        let peak = path[0];
        for (const value of path) {
          if (value > peak) peak = value;
          const drawdown = (peak - value) / peak;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
      }
      
      setMonteCarloResults({
        paths: pathsToCheck.slice(0, 50), // Keep 50 sample paths for visualization
        percentiles,
        stats: { medianFinal, meanFinal, probabilityProfit, probabilityDoubling, maxDrawdown: maxDrawdown * 100 }
      });
      
      setIsRunningMonteCarlo(false);
      toast.success(`Completed ${numSims.toLocaleString()} simulations${enableDRIP ? ' with DRIP' : ''}`);
    }, 50);
  };

  // Import historical correlations
  const importHistoricalCorrelations = async () => {
    if (stocks.length < 2) {
      toast.error('Need at least 2 stocks to calculate correlations');
      return;
    }

    setIsLoadingCorrelations(true);
    
    try {
      // Fetch historical data for all stocks
      const symbols = stocks.map(s => s.symbol);
      const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
        body: { symbols, period: correlationPeriod }
      });

      if (error) throw error;

      if (data?.correlationMatrix) {
        setCorrelationMatrix(data.correlationMatrix);
        toast.success(`Imported ${correlationPeriod} historical correlations`);
      } else {
        // Fallback: Generate realistic correlations based on typical market behavior
        const n = stocks.length;
        const newMatrix: number[][] = [];
        
        for (let i = 0; i < n; i++) {
          newMatrix[i] = [];
          for (let j = 0; j < n; j++) {
            if (i === j) {
              newMatrix[i][j] = 1;
            } else {
              // Generate realistic correlations (0.3-0.7 for most stocks)
              const baseCorr = 0.4 + Math.random() * 0.3;
              newMatrix[i][j] = Math.round(baseCorr * 100) / 100;
            }
          }
        }
        
        // Make symmetric
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            newMatrix[j][i] = newMatrix[i][j];
          }
        }
        
        setCorrelationMatrix(newMatrix);
        toast.success('Generated estimated correlations (API fallback)');
      }
    } catch (err) {
      console.error('Error fetching correlations:', err);
      
      // Fallback to realistic random correlations
      const n = stocks.length;
      const newMatrix: number[][] = [];
      
      for (let i = 0; i < n; i++) {
        newMatrix[i] = [];
        for (let j = 0; j < n; j++) {
          if (i === j) {
            newMatrix[i][j] = 1;
          } else if (j < i) {
            newMatrix[i][j] = newMatrix[j][i];
          } else {
            // Tech stocks tend to be more correlated
            const baseCorr = 0.35 + Math.random() * 0.35;
            newMatrix[i][j] = Math.round(baseCorr * 100) / 100;
          }
        }
      }
      
      setCorrelationMatrix(newMatrix);
      toast.success('Generated estimated correlations');
    } finally {
      setIsLoadingCorrelations(false);
    }
  };

  // Run stress test scenarios (including custom scenarios)
  const runStressTests = () => {
    if (!optimalPortfolio || stocks.length < 2) {
      toast.error('Need optimal portfolio to run stress tests');
      return;
    }

    setIsRunningStressTest(true);
    
    setTimeout(() => {
      const allScenarios = getAllScenarios();
      const scenariosToTest = allScenarios.filter(s => selectedScenarios.includes(s.id));
      const weights = optimalPortfolio.weights;
      const volatilities = stocks.map(s => s.volatility / 100);
      
      const results = scenariosToTest.map(scenario => {
        // Calculate portfolio beta (simplified - assume average beta of 1.1 for stocks)
        const avgBeta = 1.1;
        
        // Portfolio loss is proportional to market drop, adjusted by correlation and beta
        const portfolioLoss = scenario.marketDrop * avgBeta * (1 + (scenario.correlationIncrease - 0.5) * 0.3);
        
        // Calculate stressed value
        const stressedValue = initialInvestment * (1 + portfolioLoss / 100);
        
        // Calculate asset-specific impacts
        const assetImpacts = stocks.map((stock, i) => {
          // Higher volatility assets tend to drop more in crisis
          const volMultiplier = volatilities[i] / 0.2; // Relative to 20% avg volatility
          const assetLoss = scenario.marketDrop * avgBeta * volMultiplier * (1 + (scenario.correlationIncrease - 0.5) * 0.4);
          return {
            symbol: stock.symbol,
            loss: Math.max(assetLoss, -99), // Cap at -99%
            weight: weights[i] * 100
          };
        });
        
        // Generate monthly path simulation
        const monthlyPath: { month: number; value: number }[] = [];
        let currentValue = initialInvestment;
        
        // Decline phase
        const monthlyDecline = portfolioLoss / scenario.durationMonths;
        for (let m = 0; m <= scenario.durationMonths; m++) {
          monthlyPath.push({ month: m, value: currentValue });
          // Add some volatility to the decline
          const noise = (Math.random() - 0.5) * Math.abs(monthlyDecline) * 0.3;
          currentValue = currentValue * (1 + (monthlyDecline + noise) / 100);
        }
        
        const bottomValue = currentValue;
        
        // Recovery phase
        const totalRecovery = (initialInvestment - bottomValue) / bottomValue;
        const monthlyRecovery = totalRecovery / scenario.recoveryMonths;
        for (let m = 1; m <= scenario.recoveryMonths; m++) {
          const noise = (Math.random() - 0.5) * monthlyRecovery * 0.2;
          currentValue = currentValue * (1 + monthlyRecovery + noise);
          monthlyPath.push({ month: scenario.durationMonths + m, value: currentValue });
        }
        
        // Calculate max drawdown
        let peak = monthlyPath[0].value;
        let maxDrawdown = 0;
        for (const point of monthlyPath) {
          if (point.value > peak) peak = point.value;
          const drawdown = (peak - point.value) / peak * 100;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        
        return {
          scenario,
          portfolioLoss,
          stressedValue: Math.max(0, stressedValue),
          recoveryValue: currentValue,
          maxDrawdown,
          monthlyPath,
          assetImpacts
        };
      });
      
      setStressResults(results);
      setIsRunningStressTest(false);
      toast.success(`Completed ${results.length} stress test scenarios`);
    }, 100);
  };

  // Calculate portfolio variance
  const calculatePortfolioVariance = (weights: number[], volatilities: number[], correlations: number[][]) => {
    let variance = 0;
    const n = weights.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const corr = correlations[i]?.[j] ?? (i === j ? 1 : 0);
        variance += weights[i] * weights[j] * (volatilities[i] / 100) * (volatilities[j] / 100) * corr;
      }
    }
    
    return variance;
  };

  // Calculate portfolio return
  const calculatePortfolioReturn = (weights: number[], returns: number[]) => {
    return weights.reduce((sum, w, i) => sum + w * returns[i], 0);
  };

  // Generate efficient frontier points
  const efficientFrontier = useMemo(() => {
    if (stocks.length < 2) return [];

    const returns = stocks.map(s => s.expectedReturn);
    const volatilities = stocks.map(s => s.volatility);
    const n = stocks.length;
    const points: PortfolioPoint[] = [];

    // Generate random portfolios to approximate efficient frontier
    for (let i = 0; i < 1000; i++) {
      // Generate random weights
      const rawWeights = Array(n).fill(0).map(() => Math.random());
      const sum = rawWeights.reduce((a, b) => a + b, 0);
      const weights = rawWeights.map(w => w / sum);

      const portfolioReturn = calculatePortfolioReturn(weights, returns);
      const portfolioVariance = calculatePortfolioVariance(weights, volatilities, correlationMatrix);
      const portfolioRisk = Math.sqrt(Math.max(0, portfolioVariance)) * 100;
      const sharpe = portfolioRisk > 0 ? (portfolioReturn - riskFreeRate) / portfolioRisk : 0;

      points.push({
        risk: portfolioRisk,
        return: portfolioReturn,
        weights,
        sharpe
      });
    }

    // Sort by risk and filter for efficient frontier (highest return for each risk level)
    points.sort((a, b) => a.risk - b.risk);
    
    const frontier: PortfolioPoint[] = [];
    let maxReturn = -Infinity;
    
    for (const point of points) {
      if (point.return > maxReturn) {
        frontier.push(point);
        maxReturn = point.return;
      }
    }

    return frontier;
  }, [stocks, correlationMatrix, riskFreeRate]);

  // Find optimal portfolio based on risk tolerance
  const optimalPortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;

    // Risk tolerance 0 = minimum risk, 100 = maximum return
    const tolerance = riskTolerance[0] / 100;
    
    // Find the portfolio that maximizes Sharpe ratio within risk tolerance
    const minRisk = Math.min(...efficientFrontier.map(p => p.risk));
    const maxRisk = Math.max(...efficientFrontier.map(p => p.risk));
    const targetRisk = minRisk + tolerance * (maxRisk - minRisk);

    // Find portfolio closest to target risk with best Sharpe ratio
    const candidates = efficientFrontier.filter(p => p.risk <= targetRisk * 1.1);
    
    if (candidates.length === 0) return efficientFrontier[0];
    
    return candidates.reduce((best, current) => 
      current.sharpe > best.sharpe ? current : best
    );
  }, [efficientFrontier, riskTolerance]);

  // Maximum Sharpe ratio portfolio
  const maxSharpePortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;
    return efficientFrontier.reduce((best, current) => 
      current.sharpe > best.sharpe ? current : best
    );
  }, [efficientFrontier]);

  // Minimum variance portfolio
  const minVariancePortfolio = useMemo(() => {
    if (efficientFrontier.length === 0) return null;
    return efficientFrontier.reduce((best, current) => 
      current.risk < best.risk ? current : best
    );
  }, [efficientFrontier]);

  const addStock = () => {
    if (!newStock.symbol || !newStock.expectedReturn || !newStock.volatility) {
      toast.error('Please fill all fields');
      return;
    }

    if (stocks.find(s => s.symbol.toUpperCase() === newStock.symbol.toUpperCase())) {
      toast.error('Stock already added');
      return;
    }

    setStocks([...stocks, {
      symbol: newStock.symbol.toUpperCase(),
      expectedReturn: parseFloat(newStock.expectedReturn),
      volatility: parseFloat(newStock.volatility),
      dividendYield: newStock.dividendYield ? parseFloat(newStock.dividendYield) : 0
    }]);
    setNewStock({ symbol: '', expectedReturn: '', volatility: '', dividendYield: '' });
    toast.success(`Added ${newStock.symbol.toUpperCase()}`);
  };
  
  // Add custom stress scenario
  const addCustomScenario = () => {
    if (!newCustomScenario.name?.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }
    
    const scenario: CustomScenario = {
      id: `custom-${Date.now()}`,
      name: newCustomScenario.name.trim(),
      description: newCustomScenario.description || 'Custom stress scenario',
      marketDrop: newCustomScenario.marketDrop || -30,
      volatilitySpike: newCustomScenario.volatilitySpike || 2.5,
      correlationIncrease: newCustomScenario.correlationIncrease || 0.75,
      durationMonths: newCustomScenario.durationMonths || 6,
      recoveryMonths: newCustomScenario.recoveryMonths || 12,
    };
    
    setCustomScenarios(prev => [...prev, scenario]);
    setSelectedScenarios(prev => [...prev, scenario.id]);
    setNewCustomScenario({
      name: '',
      description: '',
      marketDrop: -30,
      volatilitySpike: 2.5,
      correlationIncrease: 0.75,
      durationMonths: 6,
      recoveryMonths: 12,
    });
    setShowCustomScenarioBuilder(false);
    toast.success(`Added custom scenario "${scenario.name}"`);
  };
  
  const deleteCustomScenario = (id: string) => {
    setCustomScenarios(prev => prev.filter(s => s.id !== id));
    setSelectedScenarios(prev => prev.filter(s => s !== id));
    toast.success('Deleted custom scenario');
  };
  
  // Get all available scenarios (predefined + custom)
  const getAllScenarios = (): (StressScenario | (CustomScenario & { period: string }))[] => {
    return [
      ...STRESS_SCENARIOS,
      ...customScenarios.map(s => ({ ...s, period: 'Custom' }))
    ];
  };

  const removeStock = (symbol: string) => {
    if (stocks.length <= 2) {
      toast.error('Need at least 2 stocks for optimization');
      return;
    }
    setStocks(stocks.filter(s => s.symbol !== symbol));
  };

  const pieData = optimalPortfolio ? stocks.map((stock, i) => ({
    name: stock.symbol,
    value: Math.round(optimalPortfolio.weights[i] * 1000) / 10
  })).filter(d => d.value > 0.5) : [];

  const scatterData = efficientFrontier.map(p => ({
    x: p.risk,
    y: p.return,
    sharpe: p.sharpe
  }));

  const getRiskLabel = (value: number) => {
    if (value < 25) return 'Conservative';
    if (value < 50) return 'Moderate';
    if (value < 75) return 'Growth';
    return 'Aggressive';
  };

  return (
    <div className="space-y-6">
      {/* Header with Save/Load Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Optimizer</h2>
          <p className="text-sm text-muted-foreground">Modern Portfolio Theory-based allocation</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Portfolio Preset</DialogTitle>
                <DialogDescription>
                  Save current configuration for quick access later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., Conservative Growth"
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">This will save:</p>
                  <ul className="list-disc list-inside">
                    <li>{stocks.length} assets with returns & volatility</li>
                    <li>Correlation matrix ({stocks.length}×{stocks.length})</li>
                    <li>Risk tolerance: {riskTolerance[0]}%</li>
                    <li>Risk-free rate: {riskFreeRate}%</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={savePreset}>Save Preset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load Portfolio Preset</DialogTitle>
                <DialogDescription>
                  Select a saved configuration to load
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {presets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No saved presets yet</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {preset.stocks.length} assets • Risk: {preset.riskTolerance}% • {new Date(preset.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {preset.stocks.slice(0, 5).map((s) => (
                              <Badge key={s.symbol} variant="secondary" className="text-xs">{s.symbol}</Badge>
                            ))}
                            {preset.stocks.length > 5 && (
                              <Badge variant="outline" className="text-xs">+{preset.stocks.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => loadPreset(preset)}>Load</Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePreset(preset.id, preset.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="assets">Assets & Optimization</TabsTrigger>
          <TabsTrigger value="correlations">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Correlations
          </TabsTrigger>
          <TabsTrigger value="montecarlo">
            <PlayCircle className="h-4 w-4 mr-2" />
            Monte Carlo
          </TabsTrigger>
          <TabsTrigger value="stress">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Stress Testing
          </TabsTrigger>
          <TabsTrigger value="frontier">Efficient Frontier</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Assets
            </CardTitle>
            <CardDescription>Add stocks with expected returns and volatility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Symbol</Label>
                <Input
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
                  placeholder="TSLA"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Return %</Label>
                <Input
                  type="number"
                  value={newStock.expectedReturn}
                  onChange={(e) => setNewStock({ ...newStock, expectedReturn: e.target.value })}
                  placeholder="15"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Vol %</Label>
                <Input
                  type="number"
                  value={newStock.volatility}
                  onChange={(e) => setNewStock({ ...newStock, volatility: e.target.value })}
                  placeholder="35"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Div %</Label>
                <Input
                  type="number"
                  value={newStock.dividendYield}
                  onChange={(e) => setNewStock({ ...newStock, dividendYield: e.target.value })}
                  placeholder="2.5"
                  className="h-8"
                />
              </div>
            </div>
            <Button onClick={addStock} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stocks.map((stock, i) => (
                <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium">{stock.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{stock.expectedReturn}%r</span>
                    <span>{stock.volatility}%v</span>
                    {(stock.dividendYield || 0) > 0 && (
                      <span className="text-green-600">{stock.dividendYield}%d</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeStock(stock.symbol)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t space-y-3">
              <div>
                <Label className="text-xs">Risk-Free Rate (%)</Label>
                <Input
                  type="number"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
                  className="h-8"
                  step="0.1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Tolerance & Optimal Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Profile
            </CardTitle>
            <CardDescription>Adjust your risk tolerance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Risk Tolerance</Label>
                <Badge variant="outline">{getRiskLabel(riskTolerance[0])}</Badge>
              </div>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            {optimalPortfolio && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Optimal Allocation
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Portfolio Metrics
            </CardTitle>
            <CardDescription>Expected performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimalPortfolio ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Expected Return</div>
                    <div className="text-xl font-bold text-primary">
                      {optimalPortfolio.return.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Expected Risk</div>
                    <div className="text-xl font-bold">
                      {optimalPortfolio.risk.toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-xl font-bold text-chart-2">
                      {optimalPortfolio.sharpe.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Return/Risk</div>
                    <div className="text-xl font-bold">
                      {(optimalPortfolio.return / optimalPortfolio.risk).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Recommended Weights</h4>
                  {stocks.map((stock, i) => {
                    const weight = optimalPortfolio.weights[i] * 100;
                    if (weight < 0.5) return null;
                    return (
                      <div key={stock.symbol} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="flex-1 text-sm">{stock.symbol}</span>
                        <span className="font-medium">{weight.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Add at least 2 stocks to optimize
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Correlation Matrix Editor
              </CardTitle>
              <CardDescription>
                Edit correlations between assets (-1 to 1). Matrix is symmetric - editing one cell updates its mirror.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stocks.length < 2 ? (
                <p className="text-center text-muted-foreground py-8">Add at least 2 assets to edit correlations</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-sm font-medium"></th>
                          {stocks.map((s) => (
                            <th key={s.symbol} className="p-2 text-center text-sm font-mono font-medium min-w-[70px]">
                              {s.symbol}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((rowStock, i) => (
                          <tr key={rowStock.symbol}>
                            <td className="p-2 text-sm font-mono font-medium">{rowStock.symbol}</td>
                            {stocks.map((colStock, j) => (
                              <td key={colStock.symbol} className="p-1">
                                {i === j ? (
                                  <div className="w-16 h-8 flex items-center justify-center bg-muted rounded text-sm font-medium mx-auto">
                                    1.00
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="-1"
                                    max="1"
                                    step="0.05"
                                    value={correlationMatrix[i]?.[j]?.toFixed(2) ?? '0.40'}
                                    onChange={(e) => updateCorrelation(i, j, parseFloat(e.target.value) || 0)}
                                    className={`w-16 h-8 text-center text-sm mx-auto ${
                                      (correlationMatrix[i]?.[j] ?? 0) > 0.3
                                        ? 'border-green-500/50'
                                        : (correlationMatrix[i]?.[j] ?? 0) < -0.1
                                        ? 'border-red-500/50'
                                        : ''
                                    }`}
                                  />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Import Historical Correlations */}
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-sm font-medium">Import Historical Correlations</Label>
                      <p className="text-xs text-muted-foreground">Fetch real market correlations based on historical data</p>
                    </div>
                    <Select value={correlationPeriod} onValueChange={setCorrelationPeriod}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Month</SelectItem>
                        <SelectItem value="3m">3 Months</SelectItem>
                        <SelectItem value="6m">6 Months</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="2y">2 Years</SelectItem>
                        <SelectItem value="5y">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={importHistoricalCorrelations}
                      disabled={isLoadingCorrelations || stocks.length < 2}
                    >
                      {isLoadingCorrelations ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0');
                      }}
                    >
                      Set All to 0
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0.3))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0.3');
                      }}
                    >
                      Low (0.3)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : 0.6))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set all correlations to 0.6');
                      }}
                    >
                      High (0.6)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMatrix = stocks.map((_, i) =>
                          stocks.map((_, j) => (i === j ? 1 : -0.2))
                        );
                        setCorrelationMatrix(newMatrix);
                        toast.success('Set negative correlations');
                      }}
                    >
                      Negative (-0.2)
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">Correlation guide:</span></p>
                    <p>• <span className="text-green-600">1.0</span>: Perfect positive correlation (assets move together)</p>
                    <p>• <span className="text-muted-foreground">0.0</span>: No correlation (independent movement)</p>
                    <p>• <span className="text-red-600">-1.0</span>: Perfect negative correlation (assets move opposite)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monte Carlo Simulation Tab */}
        <TabsContent value="montecarlo">
          <div className="space-y-6">
            {/* Simulation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Monte Carlo Simulation
                </CardTitle>
                <CardDescription>
                  Project future portfolio performance using {monteCarloSimulations.toLocaleString()} random market scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <Label className="text-xs">Initial Investment ($)</Label>
                    <Input
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 100000)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Time Horizon (Years)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={monteCarloYears}
                      onChange={(e) => setMonteCarloYears(Math.min(30, Math.max(1, parseInt(e.target.value) || 10)))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Simulations</Label>
                    <Select value={monteCarloSimulations.toString()} onValueChange={(v) => setMonteCarloSimulations(parseInt(v))}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1,000</SelectItem>
                        <SelectItem value="5000">5,000</SelectItem>
                        <SelectItem value="10000">10,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Coins className="h-3 w-3" /> DRIP Enabled
                    </Label>
                    <div className="flex items-center h-9">
                      <Switch
                        checked={enableDRIP}
                        onCheckedChange={setEnableDRIP}
                      />
                      <span className="ml-2 text-xs text-muted-foreground">
                        {enableDRIP ? 'Reinvest' : 'Cash'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={runMonteCarloSimulation}
                      disabled={isRunningMonteCarlo || !optimalPortfolio}
                      className="w-full"
                    >
                      {isRunningMonteCarlo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Portfolio Dividend Yield Info */}
                {optimalPortfolio && (
                  <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Portfolio Dividend Yield: <span className="font-medium">
                          {(optimalPortfolio.weights.reduce((sum, w, i) => sum + w * (stocks[i]?.dividendYield || 0), 0)).toFixed(2)}%
                        </span>
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Est. Annual Income: <span className="font-medium text-green-600">
                        ${(initialInvestment * optimalPortfolio.weights.reduce((sum, w, i) => sum + w * (stocks[i]?.dividendYield || 0), 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                )}

                {!optimalPortfolio && (
                  <p className="text-center text-muted-foreground py-4">
                    Add at least 2 assets and set allocations to run simulation
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {monteCarloResults && (
              <>
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground">Median Final Value</div>
                      <div className="text-xl font-bold text-primary">
                        ${monteCarloResults.stats.medianFinal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground">Mean Final Value</div>
                      <div className="text-xl font-bold">
                        ${monteCarloResults.stats.meanFinal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground">Probability of Profit</div>
                      <div className="text-xl font-bold text-green-600">
                        {monteCarloResults.stats.probabilityProfit.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground">Chance of Doubling</div>
                      <div className="text-xl font-bold text-chart-2">
                        {monteCarloResults.stats.probabilityDoubling.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground">Max Drawdown</div>
                      <div className="text-xl font-bold text-destructive">
                        {monteCarloResults.stats.maxDrawdown.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Percentile Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Value Projections</CardTitle>
                    <CardDescription>
                      Showing 10th, 25th, 50th (median), 75th, and 90th percentile outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monteCarloResults.percentiles} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="year" 
                            label={{ value: 'Year', position: 'bottom', offset: 0 }}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
                            labelFormatter={(year) => `Year ${year}`}
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="p90"
                            name="90th Percentile"
                            stroke="hsl(var(--chart-1))"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.1}
                          />
                          <Area
                            type="monotone"
                            dataKey="p75"
                            name="75th Percentile"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            fillOpacity={0.15}
                          />
                          <Area
                            type="monotone"
                            dataKey="p50"
                            name="Median"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="p25"
                            name="25th Percentile"
                            stroke="hsl(var(--chart-4))"
                            fill="hsl(var(--chart-4))"
                            fillOpacity={0.15}
                          />
                          <Area
                            type="monotone"
                            dataKey="p10"
                            name="10th Percentile"
                            stroke="hsl(var(--chart-5))"
                            fill="hsl(var(--chart-5))"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Paths */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Simulation Paths</CardTitle>
                    <CardDescription>
                      Showing 50 individual simulation paths to visualize volatility
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="year"
                            type="number"
                            domain={[0, monteCarloYears]}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          {monteCarloResults.paths.slice(0, 30).map((path, idx) => (
                            <Line
                              key={idx}
                              data={path.map((value, year) => ({ year, value }))}
                              type="monotone"
                              dataKey="value"
                              stroke={`hsl(${(idx * 12) % 360}, 70%, 50%)`}
                              strokeWidth={1}
                              dot={false}
                              opacity={0.4}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Yearly Income Table */}
                {yearlyIncomeResults && yearlyIncomeResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Yearly Income Projection
                      </CardTitle>
                      <CardDescription>
                        Projected dividend income for each year {enableDRIP ? '(DRIP enabled - dividends reinvested)' : '(dividends paid as cash)'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-80 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Year</TableHead>
                              <TableHead>Portfolio Value</TableHead>
                              <TableHead>Dividend Income</TableHead>
                              <TableHead>Cumulative Income</TableHead>
                              {enableDRIP && <TableHead>Value with DRIP</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearlyIncomeResults.map((year) => (
                              <TableRow key={year.year}>
                                <TableCell className="font-medium">{year.year}</TableCell>
                                <TableCell>${year.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                                <TableCell className="text-green-600">
                                  ${year.dividendIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  ${year.cumulativeIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </TableCell>
                                {enableDRIP && (
                                  <TableCell className="font-medium text-primary">
                                    ${year.reinvestedValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Income Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <div className="text-xs text-muted-foreground">Total Income ({monteCarloYears}yr)</div>
                          <div className="text-lg font-bold text-green-600">
                            ${yearlyIncomeResults[yearlyIncomeResults.length - 1]?.cumulativeIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">Avg Annual Income</div>
                          <div className="text-lg font-bold">
                            ${(yearlyIncomeResults.reduce((sum, y) => sum + y.dividendIncome, 0) / monteCarloYears).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        {enableDRIP && (
                          <>
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <div className="text-xs text-muted-foreground">Final Value (DRIP)</div>
                              <div className="text-lg font-bold text-primary">
                                ${yearlyIncomeResults[yearlyIncomeResults.length - 1]?.reinvestedValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                            <div className="p-3 bg-chart-2/10 rounded-lg">
                              <div className="text-xs text-muted-foreground">DRIP Bonus</div>
                              <div className="text-lg font-bold text-chart-2">
                                +${((yearlyIncomeResults[yearlyIncomeResults.length - 1]?.reinvestedValue || 0) - yearlyIncomeResults[yearlyIncomeResults.length - 1]?.portfolioValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Stress Testing Tab */}
        <TabsContent value="stress">
          <div className="space-y-6">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Stress Test Scenarios
                </CardTitle>
                <CardDescription>
                  See how your portfolio would perform during historical market crises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Predefined Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {STRESS_SCENARIOS.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedScenarios.includes(scenario.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (selectedScenarios.includes(scenario.id)) {
                          setSelectedScenarios(prev => prev.filter(id => id !== scenario.id));
                        } else {
                          setSelectedScenarios(prev => [...prev, scenario.id]);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{scenario.name}</h4>
                        <Badge variant={scenario.marketDrop < -40 ? 'destructive' : 'secondary'} className="text-xs">
                          {scenario.marketDrop}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <span>{scenario.period}</span>
                        <span className="mx-2">•</span>
                        <span>Recovery: {scenario.recoveryMonths}mo</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Custom Scenarios Section */}
                {customScenarios.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Custom Scenarios
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedScenarios.includes(scenario.id)
                              ? 'border-chart-2 bg-chart-2/5'
                              : 'border-border hover:border-chart-2/50'
                          }`}
                          onClick={() => {
                            if (selectedScenarios.includes(scenario.id)) {
                              setSelectedScenarios(prev => prev.filter(id => id !== scenario.id));
                            } else {
                              setSelectedScenarios(prev => [...prev, scenario.id]);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{scenario.name}</h4>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">{scenario.marketDrop}%</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomScenario(scenario.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                          <div className="text-xs text-muted-foreground">
                            <span>Duration: {scenario.durationMonths}mo</span>
                            <span className="mx-2">•</span>
                            <span>Recovery: {scenario.recoveryMonths}mo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Scenario Builder */}
                <Dialog open={showCustomScenarioBuilder} onOpenChange={setShowCustomScenarioBuilder}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mb-6">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Scenario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Custom Stress Scenario</DialogTitle>
                      <DialogDescription>
                        Define your own hypothetical market crash parameters
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Scenario Name</Label>
                          <Input
                            value={newCustomScenario.name || ''}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Severe Recession"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={newCustomScenario.description || ''}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of the scenario"
                          />
                        </div>
                        <div>
                          <Label>Market Drop (%)</Label>
                          <Input
                            type="number"
                            value={newCustomScenario.marketDrop || -30}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, marketDrop: parseFloat(e.target.value) || -30 }))}
                            max={0}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Negative value (e.g., -40)</p>
                        </div>
                        <div>
                          <Label>Volatility Spike (x)</Label>
                          <Input
                            type="number"
                            value={newCustomScenario.volatilitySpike || 2.5}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, volatilitySpike: parseFloat(e.target.value) || 2.5 }))}
                            min={1}
                            max={10}
                            step={0.5}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Multiplier (1-10x)</p>
                        </div>
                        <div>
                          <Label>Correlation Increase</Label>
                          <Input
                            type="number"
                            value={newCustomScenario.correlationIncrease || 0.75}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, correlationIncrease: parseFloat(e.target.value) || 0.75 }))}
                            min={0}
                            max={1}
                            step={0.05}
                          />
                          <p className="text-xs text-muted-foreground mt-1">0-1 (assets move together)</p>
                        </div>
                        <div>
                          <Label>Duration (months)</Label>
                          <Input
                            type="number"
                            value={newCustomScenario.durationMonths || 6}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 6 }))}
                            min={1}
                            max={60}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Recovery Time (months)</Label>
                          <Input
                            type="number"
                            value={newCustomScenario.recoveryMonths || 12}
                            onChange={(e) => setNewCustomScenario(prev => ({ ...prev, recoveryMonths: parseInt(e.target.value) || 12 }))}
                            min={1}
                            max={120}
                          />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                        <p className="font-medium">Scenario Preview:</p>
                        <p>A {Math.abs(newCustomScenario.marketDrop || 30)}% market decline over {newCustomScenario.durationMonths || 6} months</p>
                        <p>Recovery to pre-crash levels in ~{newCustomScenario.recoveryMonths || 12} months</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCustomScenarioBuilder(false)}>Cancel</Button>
                      <Button onClick={addCustomScenario}>Create Scenario</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Starting Portfolio Value</Label>
                    <Input
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 100000)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={runStressTests}
                      disabled={isRunningStressTest || !optimalPortfolio || selectedScenarios.length === 0}
                      className="h-9"
                    >
                      {isRunningStressTest ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Run Stress Tests ({selectedScenarios.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {!optimalPortfolio && (
                  <p className="text-center text-muted-foreground py-4 mt-4">
                    Add at least 2 assets and set allocations to run stress tests
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stress Test Results */}
            {stressResults && stressResults.length > 0 && (
              <>
                {/* Summary Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Impact on your ${initialInvestment.toLocaleString()} portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stressResults.map(r => ({
                            name: r.scenario.name.split(' ')[0],
                            loss: Math.abs(r.portfolioLoss),
                            marketDrop: Math.abs(r.scenario.marketDrop),
                            recovery: r.scenario.recoveryMonths
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" unit="%" stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={70} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Bar dataKey="loss" name="Portfolio Loss" fill="hsl(var(--destructive))" />
                          <Bar dataKey="marketDrop" name="Market Drop" fill="hsl(var(--chart-1))" opacity={0.6} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Results for Each Scenario */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stressResults.map((result) => (
                    <Card key={result.scenario.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{result.scenario.name}</CardTitle>
                          <Badge variant="destructive">{result.portfolioLoss.toFixed(1)}%</Badge>
                        </div>
                        <CardDescription>{result.scenario.period}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <div className="text-xs text-muted-foreground">Initial</div>
                            <div className="font-semibold">${initialInvestment.toLocaleString()}</div>
                          </div>
                          <div className="p-2 bg-destructive/10 rounded text-center">
                            <div className="text-xs text-muted-foreground">At Bottom</div>
                            <div className="font-semibold text-destructive">
                              ${result.stressedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div className="p-2 bg-green-500/10 rounded text-center">
                            <div className="text-xs text-muted-foreground">After Recovery</div>
                            <div className="font-semibold text-green-600">
                              ${result.recoveryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>

                        {/* Portfolio Path */}
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.monthlyPath} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                              <defs>
                                <linearGradient id={`gradient-${result.scenario.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="month" hide />
                              <YAxis hide domain={['dataMin * 0.9', 'dataMax * 1.1']} />
                              <Tooltip
                                formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Value']}
                                labelFormatter={(month) => `Month ${month}`}
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                              />
                              <ReferenceLine y={initialInvestment} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--chart-1))"
                                fill={`url(#gradient-${result.scenario.id})`}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Asset Impact */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Asset Impact</div>
                          {result.assetImpacts.map((asset) => (
                            <div key={asset.symbol} className="flex items-center gap-2 text-sm">
                              <span className="font-mono w-12">{asset.symbol}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-destructive"
                                  style={{ width: `${Math.min(100, Math.abs(asset.loss))}%` }}
                                />
                              </div>
                              <span className="text-destructive text-xs w-14 text-right">
                                {asset.loss.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Max Drawdown: <span className="font-medium text-destructive">{result.maxDrawdown.toFixed(1)}%</span>
                          <span className="mx-2">•</span>
                          Recovery Time: <span className="font-medium">{result.scenario.recoveryMonths} months</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="frontier">
          {/* Efficient Frontier Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Efficient Frontier</CardTitle>
              <CardDescription>
                Risk vs. Return tradeoff for all possible portfolio combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      name="Risk"
                      unit="%"
                      domain={['dataMin - 2', 'dataMax + 2']}
                      label={{ value: 'Risk (Volatility %)', position: 'bottom', offset: 0 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      dataKey="y"
                      type="number"
                      name="Return"
                      unit="%"
                      domain={['dataMin - 2', 'dataMax + 2']}
                      label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft' }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <div className="text-sm">Return: {data.y.toFixed(2)}%</div>
                            <div className="text-sm">Risk: {data.x.toFixed(2)}%</div>
                            <div className="text-sm">Sharpe: {data.sharpe.toFixed(3)}</div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Scatter
                      name="Portfolio Options"
                      data={scatterData}
                      fill="hsl(var(--chart-1))"
                      opacity={0.6}
                    />
                    {optimalPortfolio && (
                      <Scatter
                        name="Your Portfolio"
                        data={[{ x: optimalPortfolio.risk, y: optimalPortfolio.return, sharpe: optimalPortfolio.sharpe }]}
                        fill="hsl(var(--primary))"
                        shape="star"
                      />
                    )}
                    {maxSharpePortfolio && (
                      <Scatter
                        name="Max Sharpe"
                        data={[{ x: maxSharpePortfolio.risk, y: maxSharpePortfolio.return, sharpe: maxSharpePortfolio.sharpe }]}
                        fill="hsl(var(--chart-2))"
                        shape="diamond"
                      />
                    )}
                    {minVariancePortfolio && (
                      <Scatter
                        name="Min Variance"
                        data={[{ x: minVariancePortfolio.risk, y: minVariancePortfolio.return, sharpe: minVariancePortfolio.sharpe }]}
                        fill="hsl(var(--chart-3))"
                        shape="triangle"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Special Portfolios Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
                {minVariancePortfolio && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-chart-3" />
                      <span className="font-medium">Minimum Variance</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Return: {minVariancePortfolio.return.toFixed(2)}% | Risk: {minVariancePortfolio.risk.toFixed(2)}%
                    </div>
                  </div>
                )}
                {maxSharpePortfolio && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-chart-2" />
                      <span className="font-medium">Maximum Sharpe</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Return: {maxSharpePortfolio.return.toFixed(2)}% | Sharpe: {maxSharpePortfolio.sharpe.toFixed(3)}
                    </div>
                  </div>
                )}
                {optimalPortfolio && (
                  <div className="p-4 rounded-lg border bg-primary/10 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-medium">Your Optimal</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Based on {getRiskLabel(riskTolerance[0]).toLowerCase()} risk profile
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
