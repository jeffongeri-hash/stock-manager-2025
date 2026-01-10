import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    this.props.onReset?.();
  };

  private copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `Error: ${error?.message}\n\nStack Trace:\n${error?.stack}\n\nComponent Stack:${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(details);
    toast.success('Error details copied to clipboard');
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      const { fallbackTitle = 'Something went wrong', fallbackDescription = 'An unexpected error occurred while loading this content.' } = this.props;

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">{fallbackTitle}</CardTitle>
                <CardDescription>{fallbackDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={this.handleReset} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.copyErrorDetails} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy Error Details
              </Button>
              <Button onClick={this.toggleDetails} variant="ghost" size="sm">
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-muted/50 border">
                  <p className="text-sm font-medium text-destructive mb-1">Error Message:</p>
                  <code className="text-xs text-muted-foreground break-all">
                    {error?.message || 'Unknown error'}
                  </code>
                </div>

                {error?.stack && (
                  <div className="p-3 rounded-md bg-muted/50 border">
                    <p className="text-sm font-medium mb-1">Stack Trace:</p>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div className="p-3 rounded-md bg-muted/50 border">
                    <p className="text-sm font-medium mb-1">Component Stack:</p>
                    <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
