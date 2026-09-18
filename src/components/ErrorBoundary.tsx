import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  resetKeys?: Array<unknown>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    resetKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Component:', error);
    if (errorInfo.componentStack) {
      console.error('Component Stack Trace:', errorInfo.componentStack);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasKeyChanged) {
        this.handleReset();
      }
    }
  }

  private handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      resetKey: prevState.resetKey + 1,
    }));
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 my-4 flex flex-col items-start gap-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-base">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{this.props.fallbackTitle || 'A component error occurred'}</span>
          </div>
          <p className="text-xs text-red-300/80 font-mono bg-red-950/60 p-2.5 rounded border border-red-800/40 w-full overflow-x-auto">
            {this.state.error?.message || 'Unknown render exception'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Component
          </button>
        </div>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
