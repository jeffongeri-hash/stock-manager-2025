import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, ThumbsUp, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw } from 'lucide-react';

interface TradeIdea {
  id: string;
  user_id: string;
  symbol: string;
  idea_type: string;
  description: string;
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  timeframe: string | null;
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  userLiked?: boolean;
}

export function TradeIdeasPanel() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiSymbols, setAiSymbols] = useState('');
  const [newIdea, setNewIdea] = useState({
    symbol: '',
    idea_type: 'bullish',
    description: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    timeframe: 'short',
    tags: ''
  });

  useEffect(() => {
    if (user) {
      fetchIdeas();
    }
  }, [user]);

  const fetchIdeas = async () => {
    const { data: ideasData, error: ideasError } = await supabase
      .from('trade_ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (ideasError) {
      toast.error('Failed to fetch trade ideas');
      return;
    }

    const { data: likesData } = await supabase
      .from('trade_idea_likes')
      .select('trade_idea_id')
      .eq('user_id', user?.id);

    const likedIds = new Set(likesData?.map(like => like.trade_idea_id) || []);
    
    const ideasWithLikes = ideasData?.map(idea => ({
      ...idea,
      userLiked: likedIds.has(idea.id)
    })) || [];

    setIdeas(ideasWithLikes);
  };

  const postIdea = async () => {
    if (!newIdea.symbol || !newIdea.description) {
      toast.error('Please fill in symbol and description');
      return;
    }

    const { error } = await supabase
      .from('trade_ideas')
      .insert({
        user_id: user?.id,
        symbol: newIdea.symbol.toUpperCase(),
        idea_type: newIdea.idea_type,
        description: newIdea.description,
        entry_price: newIdea.entry_price ? parseFloat(newIdea.entry_price) : null,
        target_price: newIdea.target_price ? parseFloat(newIdea.target_price) : null,
        stop_loss: newIdea.stop_loss ? parseFloat(newIdea.stop_loss) : null,
        timeframe: newIdea.timeframe,
        tags: newIdea.tags ? newIdea.tags.split(',').map(t => t.trim()) : null
      });

    if (error) {
      toast.error('Failed to post trade idea');
      return;
    }

    toast.success('Trade idea posted!');
    setShowForm(false);
    setNewIdea({
      symbol: '',
      idea_type: 'bullish',
      description: '',
      entry_price: '',
      target_price: '',
      stop_loss: '',
      timeframe: 'short',
      tags: ''
    });
    fetchIdeas();
  };

  const toggleLike = async (ideaId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      const { error } = await supabase
        .from('trade_idea_likes')
        .delete()
        .eq('trade_idea_id', ideaId)
        .eq('user_id', user?.id);

      if (!error) {
        await supabase
          .from('trade_ideas')
          .update({ likes_count: ideas.find(i => i.id === ideaId)!.likes_count - 1 })
          .eq('id', ideaId);
      }
    } else {
      const { error } = await supabase
        .from('trade_idea_likes')
        .insert({ trade_idea_id: ideaId, user_id: user?.id });

      if (!error) {
        await supabase
          .from('trade_ideas')
          .update({ likes_count: ideas.find(i => i.id === ideaId)!.likes_count + 1 })
          .eq('id', ideaId);
      }
    }

    fetchIdeas();
  };

  const getIdeaIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const generateAIIdeas = async () => {
    setGeneratingAI(true);
    setShowAIForm(false);
    try {
      const symbols = aiSymbols.trim() 
        ? aiSymbols.split(',').map(s => s.trim().toUpperCase())
        : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ', 'IWM'];

      const { data: marketData, error: marketError } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbols }
      });

      if (marketError) throw marketError;

      const { data, error } = await supabase.functions.invoke('generate-trade-ideas', {
        body: { marketData: marketData?.stocks || [] }
      });

      if (error) throw error;

      if (!data || !data.ideas) {
        throw new Error('No ideas generated');
      }

      const ideaInserts = data.ideas.map((idea: any) => ({
        user_id: user?.id,
        symbol: idea.symbol,
        idea_type: idea.idea_type,
        description: idea.description,
        entry_price: idea.entry_price,
        target_price: idea.target_price,
        stop_loss: idea.stop_loss,
        timeframe: idea.timeframe,
        tags: idea.tags
      }));

      const { error: insertError } = await supabase
        .from('trade_ideas')
        .insert(ideaInserts);

      if (insertError) throw insertError;

      toast.success(`Generated ${data.ideas.length} AI trade ideas!`);
      setAiSymbols('');
      fetchIdeas();
    } catch (err: any) {
      console.error('Error generating AI ideas:', err);
      if (err.message?.includes('429') || err.message?.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('402') || err.message?.includes('credits')) {
        toast.error('AI credits depleted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate AI trade ideas');
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Community Trade Ideas</CardTitle>
            <CardDescription>Share and discover trading setups from the community</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIForm(!showAIForm)} disabled={generatingAI} variant="outline">
              {generatingAI ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generatingAI ? 'Generating...' : 'AI Generate'}
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Post Idea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAIForm && (
            <div className="mb-6 p-4 border rounded-lg space-y-4">
              <div>
                <Label>Symbols for AI Analysis (comma separated)</Label>
                <Input
                  value={aiSymbols}
                  onChange={(e) => setAiSymbols(e.target.value)}
                  placeholder="AAPL, TSLA, NVDA (leave blank for top stocks)"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={generateAIIdeas} disabled={generatingAI}>
                  {generatingAI ? 'Generating...' : 'Generate Ideas'}
                </Button>
                <Button variant="outline" onClick={() => setShowAIForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {showForm && (
            <div className="mb-6 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Symbol*</Label>
                  <Input
                    value={newIdea.symbol}
                    onChange={(e) => setNewIdea({ ...newIdea, symbol: e.target.value.toUpperCase() })}
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <Label>Idea Type*</Label>
                  <Select value={newIdea.idea_type} onValueChange={(value) => setNewIdea({ ...newIdea, idea_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullish">Bullish</SelectItem>
                      <SelectItem value="bearish">Bearish</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Entry Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newIdea.entry_price}
                    onChange={(e) => setNewIdea({ ...newIdea, entry_price: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <Label>Target Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newIdea.target_price}
                    onChange={(e) => setNewIdea({ ...newIdea, target_price: e.target.value })}
                    placeholder="165.00"
                  />
                </div>
              </div>
              <div>
                <Label>Description*</Label>
                <Textarea
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="Explain your thesis..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={postIdea}>Post Idea</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {ideas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No trade ideas yet. Be the first to post!</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {ideas.slice(0, 10).map((idea) => (
                <Card key={idea.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getIdeaIcon(idea.idea_type)}
                        <div>
                          <h3 className="font-bold">{idea.symbol}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{idea.idea_type}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(idea.id, idea.userLiked || false)}
                        className={idea.userLiked ? 'text-primary' : ''}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {idea.likes_count}
                      </Button>
                    </div>
                    <p className="text-sm line-clamp-2">{idea.description}</p>
                    {idea.target_price && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Target: <span className="text-green-500">${idea.target_price.toFixed(2)}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TradeIdeasPanel;
