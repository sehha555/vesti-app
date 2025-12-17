import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--vesti-background)] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-50 p-6">
                <AlertTriangle className="h-12 w-12 text-red-500" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-3 text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>
              哎呀！發生了一些問題
            </h2>

            {/* Description */}
            <p className="mb-6 text-[var(--vesti-gray-mid)]">
              我們遇到了一個意外的錯誤。請嘗試重新整理頁面，如果問題持續發生，請聯繫客服。
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-[var(--vesti-gray-mid)] mb-2" style={{ fontSize: 'var(--text-label)' }}>
                  技術細節
                </summary>
                <pre className="bg-[var(--vesti-gray-light)] p-4 rounded-xl overflow-auto text-xs text-[var(--vesti-dark)]">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full rounded-full bg-[var(--vesti-primary)] px-6 py-3 text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
                style={{ fontWeight: 600 }}
              >
                <RefreshCw className="h-5 w-5" />
                重新載入
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 w-full rounded-full border-2 border-[var(--vesti-gray-mid)]/30 bg-white px-6 py-3 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)]/50 hover:bg-[var(--vesti-gray-light)]/50 active:scale-95"
                style={{ fontWeight: 500 }}
              >
                <Home className="h-5 w-5" />
                返回首頁
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
