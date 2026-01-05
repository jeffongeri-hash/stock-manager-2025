import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, GraduationCap, Sparkles } from 'lucide-react';
import { tradeJournalSchema } from '@/lib/validations';

interface JournalEntry {
  id: string;
  symbol: string;
  entry_date: string;
  exit_date: string | null;
  strategy: string | null;
  notes: string | null;
  emotions: string | null;
  lessons_learned: string | null;
  tags: string[] | null;
  profit_loss: number | null;
  ai_grade?: string | null;
}

const TradeJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [grading, setGrading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newEntry, setNewEntry] = useState({
    symbol: '',
    entry_date: new Date().toISOString().split('T')[0],
    exit_date: '',
    strategy: '',
    notes: '',
    emotions: '',
    lessons_learned: '',
    tags: '',
    profit_loss: ''
  });

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('trade_journal')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch journal entries');
      return;
    }
    setEntries(data || []);
  };

  const addEntry = async () => {
    // Validate with zod
    const result = tradeJournalSchema.safeParse(newEntry);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }

    setFormErrors({});
    const validated = result.data;

    const { error } = await supabase
      .from('trade_journal')
      .insert({
        user_id: user?.id,
        symbol: validated.symbol,
        entry_date: validated.entry_date,
        exit_date: validated.exit_date || null,
        strategy: validated.strategy || null,
        notes: validated.notes || null,
        emotions: validated.emotions || null,
        lessons_learned: validated.lessons_learned || null,
        tags: validated.tags ? validated.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : null,
        profit_loss: validated.profit_loss ? parseFloat(validated.profit_loss) : null
      });

    if (error) {
      toast.error('Failed to add journal entry');
      return;
    }

    toast.success('Journal entry added');
    setIsAddingEntry(false);
    setFormErrors({});
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('trade_journal')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete entry');
      return;
    }

    toast.success('Entry deleted');
    fetchEntries();
  };

  const toggleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const gradeTrades = async (tradeIds: string[]) => {
    const tradesToGrade = entries.filter(e => tradeIds.includes(e.id));
    
    if (tradesToGrade.length === 0) {
      toast.error('Please select trades to grade');
      return;
    }

    setGrading(true);
    toast.info('AI is analyzing your trades...');

    try {
      const { data, error } = await supabase.functions.invoke('grade-trades', {
        body: { trades: tradesToGrade }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add credits.');
        } else {
          toast.error('Failed to grade trades');
        }
        console.error('Error grading trades:', error);
        setGrading(false);
        return;
      }

      setAiAnalysis(data.analysis);
      setShowAnalysis(true);
      toast.success('Trade analysis complete!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to grade trades');
    } finally {
      setGrading(false);
    }
  };

  return (
    <PageLayout title="Trade Journal">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Journal Entries</CardTitle>
            <div className="flex gap-2">
              {selectedEntries.size > 0 && (
                <Button 
                  onClick={() => gradeTrades(Array.from(selectedEntries))} 
                  disabled={grading}
                  variant="secondary"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {grading ? 'Grading...' : `Grade ${selectedEntries.size} Trade${selectedEntries.size > 1 ? 's' : ''}`}
                </Button>
              )}
              <Button onClick={() => setIsAddingEntry(!isAddingEntry)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAddingEntry && (
              <div className="mb-6 p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Symbol*</Label>
                    <Input
                      value={newEntry.symbol}
                      onChange={(e) => setNewEntry({ ...newEntry, symbol: e.target.value.toUpperCase() })}
                      placeholder="AAPL"
                      maxLength={10}
                      className={formErrors.symbol ? 'border-destructive' : ''}
                    />
                    {formErrors.symbol && <p className="text-sm text-destructive mt-1">{formErrors.symbol}</p>}
                  </div>
                  <div>
                    <Label>Entry Date*</Label>
                    <Input
                      type="date"
                      value={newEntry.entry_date}
                      onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                      className={formErrors.entry_date ? 'border-destructive' : ''}
                    />
                    {formErrors.entry_date && <p className="text-sm text-destructive mt-1">{formErrors.entry_date}</p>}
                  </div>
                  <div>
                    <Label>Exit Date</Label>
                    <Input
                      type="date"
                      value={newEntry.exit_date}
                      onChange={(e) => setNewEntry({ ...newEntry, exit_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>P&L</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newEntry.profit_loss}
                      onChange={(e) => setNewEntry({ ...newEntry, profit_loss: e.target.value })}
                      placeholder="150.00"
                      className={formErrors.profit_loss ? 'border-destructive' : ''}
                    />
                    {formErrors.profit_loss && <p className="text-sm text-destructive mt-1">{formErrors.profit_loss}</p>}
                  </div>
                  <div>
                    <Label>Strategy</Label>
                    <Input
                      value={newEntry.strategy}
                      onChange={(e) => setNewEntry({ ...newEntry, strategy: e.target.value })}
                      placeholder="Iron Condor, Call Spread, etc."
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      placeholder="earnings, momentum, breakout"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    placeholder="What was your thesis? Market conditions?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Emotions</Label>
                  <Textarea
                    value={newEntry.emotions}
                    onChange={(e) => setNewEntry({ ...newEntry, emotions: e.target.value })}
                    placeholder="How did you feel entering/exiting this trade?"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label>Lessons Learned</Label>
                  <Textarea
                    value={newEntry.lessons_learned}
                    onChange={(e) => setNewEntry({ ...newEntry, lessons_learned: e.target.value })}
                    placeholder="What would you do differently?"
                    rows={2}
                    maxLength={1000}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addEntry}>Save Entry</Button>
                  <Button variant="outline" onClick={() => setIsAddingEntry(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No journal entries yet. Add your first trade!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Exit Date</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.has(entry.id)}
                          onCheckedChange={() => toggleSelectEntry(entry.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{entry.symbol}</TableCell>
                      <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.exit_date ? new Date(entry.exit_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{entry.strategy || '-'}</TableCell>
                      <TableCell className={entry.profit_loss ? (entry.profit_loss >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                        {entry.profit_loss ? `$${entry.profit_loss.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.tags?.map((tag, i) => (
                          <span key={i} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs mr-1">
                            {tag}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => gradeTrades([entry.id])}
                            disabled={grading}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Dialog */}
        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                AI Trade Analysis
              </DialogTitle>
              <DialogDescription>
                Expert feedback on your trading performance
              </DialogDescription>
            </DialogHeader>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {aiAnalysis}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default TradeJournal;