import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, MapPin, DollarSign, TrendingUp, 
  Lightbulb, Globe, Users, Shield, Flame, Target,
  PiggyBank, Wallet, ExternalLink, Plane, Banknote
} from 'lucide-react';
import { IgniteUserFinancials, FireType } from '@/types/ignitefire';
import { IgniteDashboard } from '@/components/ignitefire/IgniteDashboard';
import { IgniteFIRECalculators } from '@/components/ignitefire/IgniteFIRECalculators';
import { IgniteLocationScanner } from '@/components/ignitefire/IgniteLocationScanner';
import { IgniteFamilyPlanner } from '@/components/ignitefire/IgniteFamilyPlanner';
import { IgniteDebtPayoff } from '@/components/ignitefire/IgniteDebtPayoff';
import IgniteTravelPlanner from '@/components/ignitefire/IgniteTravelPlanner';
import IgnitePaycheckPlanner from '@/components/ignitefire/IgnitePaycheckPlanner';

const IgniteFire = () => {
  const [financials, setFinancials] = useState<IgniteUserFinancials>(() => {
    const saved = localStorage.getItem('ignite_fire_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      currentAge: 30,
      retirementAge: 45,
      currentNetWorth: 50000,
      annualSpending: 40000,
      annualSavings: 20000,
      expectedReturn: 7,
      grossAnnualIncome: 100000,
      taxRate: 25,
      pensionOrSocialSecurity: 0,
      zipCode: '95814'
    };
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('ignite_fire_data', JSON.stringify(financials));
    }, 500);
    return () => clearTimeout(handler);
  }, [financials]);

  return (
    <PageLayout title="IgniteFIRE Suite">
      <div className="space-y-6">
        {/* Header with Fire Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Financial Independence, Retire Early</h2>
            <p className="text-muted-foreground">Mapping your trajectory to financial freedom</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="calculators" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">FIRE Paths</span>
            </TabsTrigger>
            <TabsTrigger value="paycheck" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Paycheck</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Geo-Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Family Cost</span>
            </TabsTrigger>
            <TabsTrigger value="debt" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Debt Lab</span>
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Travel Lab</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <IgniteDashboard financials={financials} setFinancials={setFinancials} />
          </TabsContent>

          <TabsContent value="calculators">
            <IgniteFIRECalculators financials={financials} />
          </TabsContent>

          <TabsContent value="paycheck">
            <IgnitePaycheckPlanner financials={financials} />
          </TabsContent>

          <TabsContent value="location">
            <IgniteLocationScanner />
          </TabsContent>

          <TabsContent value="family">
            <IgniteFamilyPlanner financials={financials} setFinancials={setFinancials} />
          </TabsContent>

          <TabsContent value="debt">
            <IgniteDebtPayoff />
          </TabsContent>

          <TabsContent value="travel">
            <IgniteTravelPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default IgniteFire;
