import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Edit } from 'lucide-react';

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
}

const TradeJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
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
    if (!newEntry.symbol || !newEntry.entry_date) {
      toast.error('Please fill in symbol and entry date');
      return;
    }

    const { error } = await supabase
      .from('trade_journal')
      .insert({
        user_id: user?.id,
        symbol: newEntry.symbol.toUpperCase(),
        entry_date: newEntry.entry_date,
        exit_date: newEntry.exit_date || null,
        strategy: newEntry.strategy || null,
        notes: newEntry.notes || null,
        emotions: newEntry.emotions || null,
        lessons_learned: newEntry.lessons_learned || null,
        tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()) : null,
        profit_loss: newEntry.profit_loss ? parseFloat(newEntry.profit_loss) : null
      });

    if (error) {
      toast.error('Failed to add journal entry');
      return;
    }

    toast.success('Journal entry added');
    setIsAddingEntry(false);
    setNewEntry({
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

  return (
    <PageLayout title="Trade Journal">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Journal Entries</CardTitle>
            <Button onClick={() => setIsAddingEntry(!isAddingEntry)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
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
                    />
                  </div>
                  <div>
                    <Label>Entry Date*</Label>
                    <Input
                      type="date"
                      value={newEntry.entry_date}
                      onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                    />
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
                    />
                  </div>
                  <div>
                    <Label>Strategy</Label>
                    <Input
                      value={newEntry.strategy}
                      onChange={(e) => setNewEntry({ ...newEntry, strategy: e.target.value })}
                      placeholder="Iron Condor, Call Spread, etc."
                    />
                  </div>
                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      placeholder="earnings, momentum, breakout"
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
                  />
                </div>
                <div>
                  <Label>Lessons Learned</Label>
                  <Textarea
                    value={newEntry.lessons_learned}
                    onChange={(e) => setNewEntry({ ...newEntry, lessons_learned: e.target.value })}
                    placeholder="What would you do differently?"
                    rows={2}
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
                        <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default TradeJournal;