import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, ThumbsUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const TradeIdeas = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<TradeIdea[]>([]);
  const [showForm, setShowForm] = useState(false);
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

    // Fetch user's likes
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

  return (
    <PageLayout title="Trade Ideas Feed">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Community Trade Ideas</CardTitle>
              <CardDescription>Share and discover trading setups from the community</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Post Idea
            </Button>
          </CardHeader>
          <CardContent>
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
                  <div>
                    <Label>Stop Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newIdea.stop_loss}
                      onChange={(e) => setNewIdea({ ...newIdea, stop_loss: e.target.value })}
                      placeholder="145.00"
                    />
                  </div>
                  <div>
                    <Label>Timeframe</Label>
                    <Select value={newIdea.timeframe} onValueChange={(value) => setNewIdea({ ...newIdea, timeframe: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short-term (1-7 days)</SelectItem>
                        <SelectItem value="medium">Medium-term (1-4 weeks)</SelectItem>
                        <SelectItem value="long">Long-term (1+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description*</Label>
                  <Textarea
                    value={newIdea.description}
                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                    placeholder="Explain your thesis, what you're watching for, technical/fundamental analysis..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={newIdea.tags}
                    onChange={(e) => setNewIdea({ ...newIdea, tags: e.target.value })}
                    placeholder="breakout, earnings, momentum"
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
              <div className="space-y-4">
                {ideas.map((idea) => (
                  <Card key={idea.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getIdeaIcon(idea.idea_type)}
                          <div>
                            <h3 className="font-bold text-lg">{idea.symbol}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{idea.idea_type} • {idea.timeframe}-term</p>
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
                      <p className="text-sm mb-3">{idea.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {idea.entry_price && (
                          <div>
                            <span className="text-muted-foreground">Entry:</span> ${idea.entry_price.toFixed(2)}
                          </div>
                        )}
                        {idea.target_price && (
                          <div>
                            <span className="text-muted-foreground">Target:</span> <span className="text-green-500">${idea.target_price.toFixed(2)}</span>
                          </div>
                        )}
                        {idea.stop_loss && (
                          <div>
                            <span className="text-muted-foreground">Stop:</span> <span className="text-red-500">${idea.stop_loss.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {idea.tags.map((tag, i) => (
                            <span key={i} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Posted {new Date(idea.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default TradeIdeas;