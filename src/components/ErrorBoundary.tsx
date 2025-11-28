import React, { Component, ErrorInfo, ReactNode } from 'react';
import '../App.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>
              {this.state.error?.message || 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.'}
            </p>
            <div className="error-boundary-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                Thử lại
              </button>
              <button
                className="btn btn-outline"
                onClick={() => (window.location.href = '/')}
              >
                Về trang chủ
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Chi tiết lỗi (chỉ hiện trong development)</summary>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

