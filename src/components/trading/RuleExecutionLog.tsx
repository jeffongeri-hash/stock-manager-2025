import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface ExecutionLog {
  id: string;
  rule_id: string | null;
  rule_name: string;
  triggered_at: string;
  conditions_met: any[];
  action_taken: any;
  execution_status: string;
  execution_result: any;
  symbol: string | null;
  error_message: string | null;
  execution_time_ms: number | null;
}

export const RuleExecutionLog: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadLogs();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('rule-execution-logs-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rule_execution_logs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New execution log:', payload);
            const newLog = payload.new as any;
            setLogs(prev => [{
              ...newLog,
              conditions_met: Array.isArray(newLog.conditions_met) ? newLog.conditions_met : [],
              action_taken: newLog.action_taken || {},
              execution_result: newLog.execution_result || null,
            }, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rule_execution_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLogs((data || []).map(log => ({
        ...log,
        conditions_met: Array.isArray(log.conditions_met) ? log.conditions_met : [],
        action_taken: log.action_taken || {},
        execution_result: log.execution_result || null,
      })));
    } catch (error: any) {
      console.error('Error loading execution logs:', error);
      toast.error('Failed to load execution logs');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('rule_execution_logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setLogs([]);
      toast.success('Execution logs cleared');
    } catch (error: any) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'partial':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'alert':
        return <Bell className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.symbol && log.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.execution_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.execution_status === 'success').length,
    failed: logs.filter(l => l.execution_status === 'failed').length,
    pending: logs.filter(l => l.execution_status === 'pending').length,
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please sign in to view execution logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-400">{stats.success}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Log Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Rule Execution Log
              </CardTitle>
              <CardDescription>Detailed history of rule triggers and actions taken</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by rule name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No execution logs found</p>
                <p className="text-sm">Rule executions will appear here when triggered</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <Collapsible
                    key={log.id}
                    open={expandedLogs.has(log.id)}
                    onOpenChange={() => toggleExpand(log.id)}
                  >
                    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3">
                            {expandedLogs.has(log.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action_taken?.type)}
                              <span className="font-medium">{log.rule_name}</span>
                            </div>
                            {log.symbol && (
                              <Badge variant="outline">{log.symbol}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(log.execution_status)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.triggered_at), 'MMM d, yyyy HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Conditions Met */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Conditions Met</h4>
                            <div className="flex flex-wrap gap-2">
                              {log.conditions_met.length > 0 ? (
                                log.conditions_met.map((condition: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {condition.indicator || condition.type}: {condition.value || 'triggered'}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">No conditions data</span>
                              )}
                            </div>
                          </div>

                          {/* Action Taken */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Action Taken</h4>
                            <div className="bg-muted/50 rounded p-3 text-sm">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="ml-2 font-medium capitalize">{log.action_taken?.type || 'N/A'}</span>
                                </div>
                                {log.action_taken?.quantity && (
                                  <div>
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="ml-2 font-medium">{log.action_taken.quantity}</span>
                                  </div>
                                )}
                                {log.action_taken?.orderType && (
                                  <div>
                                    <span className="text-muted-foreground">Order Type:</span>
                                    <span className="ml-2 font-medium capitalize">{log.action_taken.orderType}</span>
                                  </div>
                                )}
                                {log.execution_time_ms && (
                                  <div>
                                    <span className="text-muted-foreground">Execution Time:</span>
                                    <span className="ml-2 font-medium">{log.execution_time_ms}ms</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Execution Result */}
                          {log.execution_result && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Execution Result</h4>
                              <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto">
                                {JSON.stringify(log.execution_result, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Error Message */}
                          {log.error_message && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-red-400">Error</h4>
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-400">
                                {log.error_message}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
