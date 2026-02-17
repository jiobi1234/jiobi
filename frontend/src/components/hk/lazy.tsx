/**
 * 지연 로딩 컴포넌트 래퍼
 * 코드 스플리팅을 위한 동적 import 유틸리티
 */

import { ComponentType, lazy, Suspense, ReactNode } from 'react';
import LoadingState from './LoadingState';

/**
 * 컴포넌트를 지연 로딩하는 함수
 * @param importFunc - 동적 import 함수
 * @param fallback - 로딩 중 표시할 컴포넌트 (기본값: LoadingState)
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingState />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

