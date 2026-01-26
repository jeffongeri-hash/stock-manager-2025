import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowDown, Wallet } from 'lucide-react';

interface PaycheckWaterfallProps {
  grossPay: number;
  preTaxDeductions: number;
  federalTax: number;
  stateTax: number;
  localTax: number;
  socialSecurity: number;
  medicare: number;
  postTaxDeductions: number;
  netPay: number;
}

export function PaycheckWaterfall({
  grossPay,
  preTaxDeductions,
  federalTax,
  stateTax,
  localTax,
  socialSecurity,
  medicare,
  postTaxDeductions,
  netPay,
}: PaycheckWaterfallProps) {
  const totalTaxes = federalTax + stateTax + localTax + socialSecurity + medicare;
  
  // Calculate widths relative to gross pay
  const getWidth = (amount: number) => Math.max((amount / grossPay) * 100, 0);
  
  const steps = [
    { label: 'Gross Pay', amount: grossPay, cumulative: grossPay, color: 'bg-primary', isPositive: true },
    { label: 'Pre-Tax Deductions', amount: preTaxDeductions, cumulative: grossPay - preTaxDeductions, color: 'bg-green-500', isPositive: false },
    { label: 'Federal Tax', amount: federalTax, cumulative: grossPay - preTaxDeductions - federalTax, color: 'bg-red-500', isPositive: false },
    { label: 'State Tax', amount: stateTax, cumulative: grossPay - preTaxDeductions - federalTax - stateTax, color: 'bg-orange-500', isPositive: false },
    ...(localTax > 0 ? [{ label: 'Local Tax', amount: localTax, cumulative: grossPay - preTaxDeductions - federalTax - stateTax - localTax, color: 'bg-yellow-500', isPositive: false }] : []),
    { label: 'Social Security', amount: socialSecurity, cumulative: grossPay - preTaxDeductions - federalTax - stateTax - localTax - socialSecurity, color: 'bg-blue-500', isPositive: false },
    { label: 'Medicare', amount: medicare, cumulative: grossPay - preTaxDeductions - totalTaxes + medicare, color: 'bg-pink-500', isPositive: false },
    ...(postTaxDeductions > 0 ? [{ label: 'Post-Tax Deductions', amount: postTaxDeductions, cumulative: netPay, color: 'bg-purple-500', isPositive: false }] : []),
  ].filter(s => s.amount > 0);

  let runningTotal = grossPay;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5" />
          Paycheck Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Gross Pay */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Gross Pay</span>
              </div>
              <span className="font-bold">${grossPay.toFixed(2)}</span>
            </div>
            <div className="h-8 bg-primary rounded-md relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">100%</span>
              </div>
            </div>
          </div>

          {/* Deductions waterfall */}
          {preTaxDeductions > 0 && (
            <WaterfallStep
              label="Pre-Tax Deductions"
              amount={preTaxDeductions}
              grossPay={grossPay}
              runningTotal={runningTotal -= preTaxDeductions}
              color="bg-green-500"
              textColor="text-green-500"
            />
          )}

          {federalTax > 0 && (
            <WaterfallStep
              label="Federal Tax"
              amount={federalTax}
              grossPay={grossPay}
              runningTotal={runningTotal -= federalTax}
              color="bg-red-500"
              textColor="text-red-500"
            />
          )}

          {stateTax > 0 && (
            <WaterfallStep
              label="State Tax"
              amount={stateTax}
              grossPay={grossPay}
              runningTotal={runningTotal -= stateTax}
              color="bg-orange-500"
              textColor="text-orange-500"
            />
          )}

          {localTax > 0 && (
            <WaterfallStep
              label="Local Tax"
              amount={localTax}
              grossPay={grossPay}
              runningTotal={runningTotal -= localTax}
              color="bg-yellow-500"
              textColor="text-yellow-500"
            />
          )}

          {socialSecurity > 0 && (
            <WaterfallStep
              label="Social Security"
              amount={socialSecurity}
              grossPay={grossPay}
              runningTotal={runningTotal -= socialSecurity}
              color="bg-blue-500"
              textColor="text-blue-500"
            />
          )}

          {medicare > 0 && (
            <WaterfallStep
              label="Medicare"
              amount={medicare}
              grossPay={grossPay}
              runningTotal={runningTotal -= medicare}
              color="bg-pink-500"
              textColor="text-pink-500"
            />
          )}

          {postTaxDeductions > 0 && (
            <WaterfallStep
              label="Post-Tax Deductions"
              amount={postTaxDeductions}
              grossPay={grossPay}
              runningTotal={runningTotal -= postTaxDeductions}
              color="bg-purple-500"
              textColor="text-purple-500"
            />
          )}

          {/* Net Pay Result */}
          <div className="pt-2 mt-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Net Pay (Take Home)</span>
              </div>
              <span className="font-bold text-green-500">${netPay.toFixed(2)}</span>
            </div>
            <div className="h-10 bg-muted rounded-md relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-md transition-all duration-500"
                style={{ width: `${(netPay / grossPay) * 100}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {((netPay / grossPay) * 100).toFixed(1)}% of gross
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Pre-Tax Savings</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Federal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>State</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>FICA</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Take Home</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WaterfallStep({ 
  label, 
  amount, 
  grossPay, 
  runningTotal,
  color,
  textColor,
}: { 
  label: string; 
  amount: number; 
  grossPay: number;
  runningTotal: number;
  color: string;
  textColor: string;
}) {
  const deductionWidth = (amount / grossPay) * 100;
  const remainingWidth = (runningTotal / grossPay) * 100;
  const offsetLeft = remainingWidth;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium ${textColor}`}>-${amount.toFixed(2)}</span>
      </div>
      <div className="h-6 bg-muted rounded relative overflow-hidden">
        {/* Remaining portion (lighter) */}
        <div 
          className="absolute h-full bg-muted-foreground/10 rounded-l"
          style={{ width: `${remainingWidth}%` }}
        />
        {/* Deduction portion */}
        <div 
          className={`absolute h-full ${color} rounded opacity-80`}
          style={{ 
            width: `${deductionWidth}%`,
            left: `${offsetLeft}%`
          }}
        />
        {/* Remaining total label */}
        <div 
          className="absolute h-full flex items-center px-2"
          style={{ width: `${remainingWidth}%` }}
        >
          <span className="text-xs text-muted-foreground">
            ${runningTotal.toFixed(0)} left
          </span>
        </div>
      </div>
    </div>
  );
}
