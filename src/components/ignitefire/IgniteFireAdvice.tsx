import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Zap, Briefcase, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IgniteUserFinancials } from '@/types/ignitefire';
import ReactMarkdown from 'react-markdown';

interface IgniteFireAdviceProps {
  financials: IgniteUserFinancials;
}

const IgniteFireAdvice: React.FC<IgniteFireAdviceProps> = ({ financials }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const financialData = `Net worth: $${financials.currentNetWorth.toLocaleString()}, Gross Income: $${financials.grossAnnualIncome.toLocaleString()}, Annual Spending: $${financials.annualSpending.toLocaleString()}, Annual Savings: $${financials.annualSavings.toLocaleString()}, Age: ${financials.currentAge}, Target Retirement Age: ${financials.retirementAge}, Expected Return: ${financials.expectedReturn}%, Tax Rate: ${financials.taxRate}%`;
      
      const { data, error } = await supabase.functions.invoke('ignite-fire-advice', {
        body: { financialData }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setAdvice(data.advice);
      toast.success('FIRE acceleration strategies generated');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate advice');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (advice) {
      const updated = [...savedNotes, advice];
      setSavedNotes(updated);
      localStorage.setItem('ignite_fire_notes', JSON.stringify(updated));
      toast.success('Insight saved');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('ignite_fire_notes');
    if (saved) {
      try { setSavedNotes(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-primary rounded-2xl shrink-0">
            <Zap className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Accelerate Your FIRE Timeline</h2>
            <p className="text-muted-foreground text-sm mb-4">Customized side-hustle recommendations and efficiency strategies powered by Gemini AI.</p>
            <div className="flex gap-3">
              <Button onClick={fetchAdvice} disabled={loading}>
                {loading ? 'Analyzing...' : 'Generate New Strategies'}
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={!advice}>
                <Bookmark className="h-4 w-4 mr-2" />
                Save Insight
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {advice ? (
            <Card>
              <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{advice}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-16 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Click generate for your personalized acceleration plan.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Barista FIRE Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Hobby Farm Hand', 'Seasonal Ranger', 'Coffee Roaster', 'Freelance Tutor', 'Dog Walker'].map(job => (
                <div key={job} className="p-3 bg-muted rounded-lg text-sm font-medium">
                  {job}
                </div>
              ))}
            </CardContent>
          </Card>

          {savedNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  Saved Insights ({savedNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedNotes.slice(-3).map((note, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg text-xs text-muted-foreground line-clamp-3">
                    {note.slice(0, 150)}...
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IgniteFireAdvice;
