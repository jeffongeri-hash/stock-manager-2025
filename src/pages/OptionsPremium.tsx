import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export default function OptionsPremium() {
  const [iv, setIv] = useState('');
  const [hv, setHv] = useState('');
  const [ivRank, setIvRank] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [recommendationType, setRecommendationType] = useState('');

  const premiumDecision = (iv: number, hv: number, ivRank: number) => {
    if (iv > hv) {
      if (ivRank > 50) {
        return "SELL premium (options expensive, high POP for sellers)";
      } else if (ivRank >= 30 && ivRank <= 50) {
        return "SELL premium cautiously (moderate IV rank)";
      } else {
        return "Consider waiting or small SELL premium positions";
      }
    } else if (iv < hv) {
      if (ivRank < 30) {
        return "BUY premium (options cheap, potential large move)";
      } else if (ivRank >= 30 && ivRank <= 50) {
        return "BUY premium cautiously (moderate IV)";
      } else {
        return "Neutral / monitor market";
      }
    } else {
      return "Neutral / small premium trades or directional bets";
    }
  };

  const getRecommendationType = (recommendation: string) => {
    if (recommendation.includes('SELL')) return 'sell';
    if (recommendation.includes('BUY')) return 'buy';
    if (recommendation.includes('Neutral')) return 'neutral';
    return 'caution';
  };

  const updateCalculation = () => {
    const ivVal = parseFloat(iv);
    const hvVal = parseFloat(hv);
    const ivRankVal = parseFloat(ivRank);

    if (!isNaN(ivVal) && !isNaN(hvVal) && !isNaN(ivRankVal) && ivRankVal >= 0 && ivRankVal <= 100) {
      const rec = premiumDecision(ivVal, hvVal, ivRankVal);
      setRecommendation(rec);
      setRecommendationType(getRecommendationType(rec));
    }
  };

  const getIcon = () => {
    switch (recommendationType) {
      case 'sell':
        return <TrendingDown className="h-6 w-6" />;
      case 'buy':
        return <TrendingUp className="h-6 w-6" />;
      case 'neutral':
        return <Minus className="h-6 w-6" />;
      default:
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  const getCardColor = () => {
    switch (recommendationType) {
      case 'sell':
        return 'border-danger/50 bg-danger/5';
      case 'buy':
        return 'border-success/50 bg-success/5';
      case 'neutral':
        return 'border-warning/50 bg-warning/5';
      default:
        return 'border-primary/50 bg-primary/5';
    }
  };

  return (
    <PageLayout title="Options Premium Calculator">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Option Parameters</CardTitle>
            <CardDescription>Enter volatility metrics to get a recommendation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="iv">Implied Volatility (IV) %</Label>
              <Input
                id="iv"
                type="number"
                placeholder="e.g., 25.5"
                step="0.1"
                value={iv}
                onChange={(e) => {
                  setIv(e.target.value);
                  setTimeout(updateCalculation, 0);
                }}
              />
            </div>
            <div>
              <Label htmlFor="hv">Historical Volatility (HV) %</Label>
              <Input
                id="hv"
                type="number"
                placeholder="e.g., 20.3"
                step="0.1"
                value={hv}
                onChange={(e) => {
                  setHv(e.target.value);
                  setTimeout(updateCalculation, 0);
                }}
              />
            </div>
            <div>
              <Label htmlFor="ivrank">IV Rank %</Label>
              <Input
                id="ivrank"
                type="number"
                placeholder="e.g., 75"
                step="1"
                min="0"
                max="100"
                value={ivRank}
                onChange={(e) => {
                  setIvRank(e.target.value);
                  setTimeout(updateCalculation, 0);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {recommendation && (
            <Card className={getCardColor()}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${
                    recommendationType === 'sell' ? 'text-danger' :
                    recommendationType === 'buy' ? 'text-success' :
                    recommendationType === 'neutral' ? 'text-warning' :
                    'text-primary'
                  }`}>
                    {getIcon()}
                  </div>
                  <div>
                    <CardTitle className="text-base">Recommendation</CardTitle>
                    <p className="text-sm mt-2">{recommendation}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <strong>IV vs HV:</strong> {
                    parseFloat(iv) > parseFloat(hv) ? 'IV > HV (expensive options)' :
                    parseFloat(iv) < parseFloat(hv) ? 'IV < HV (cheap options)' :
                    'IV ≈ HV (fairly priced)'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>IV Rank:</strong> {ivRank}% - {
                    parseFloat(ivRank) > 50 ? 'High' :
                    parseFloat(ivRank) < 30 ? 'Low' : 'Moderate'
                  }
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• IV &gt; HV: Options may be expensive, consider selling premium</li>
                <li>• IV &lt; HV: Options may be cheap, consider buying premium</li>
                <li>• IV Rank shows current IV relative to 1-year range</li>
                <li>• Higher IV Rank (&gt;50%) favors selling, lower (&lt;30%) favors buying</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
