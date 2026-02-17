'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { logError } from '../../utils/logger';
import ErrorBoundaryFallback from './ErrorBoundaryFallback';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  messages?: any; // 번역 메시지
}

interface ErrorBoundaryWrapperState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 래퍼 컴포넌트 (클라이언트 컴포넌트)
 * 하위 컴포넌트에서 발생한 에러를 잡아서 폴백 UI를 표시
 */
export default class ErrorBoundaryWrapper extends Component<ErrorBoundaryWrapperProps, ErrorBoundaryWrapperState> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryWrapperState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ErrorBoundary caught an error', { error, errorInfo }, 'ErrorBoundary');
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorBoundaryFallback error={this.state.error} onReset={this.handleReset} messages={this.props.messages} />;
    }

    return this.props.children;
  }
}

