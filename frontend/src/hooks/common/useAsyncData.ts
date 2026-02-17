/**
 * 범용 비동기 데이터 페칭 훅
 * 로딩, 에러, 데이터 상태를 통합 관리하는 재사용 가능한 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiError } from './useApiError';
import { logError } from '../../utils/logger';

export interface UseAsyncDataOptions<T> {
  immediate?: boolean; // 즉시 실행 여부
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  retryCount?: number; // 재시도 횟수
  retryDelay?: number; // 재시도 지연 시간 (ms)
}

export interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  refetch: () => Promise<T | undefined>;
  reset: () => void;
}

/**
 * 비동기 데이터 페칭 훅
 * @param asyncFunction - 비동기 함수
 * @param options - 옵션 설정
 */
export function useAsyncData<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const lastArgsRef = useRef<any[]>([]);

  /**
   * 비동기 함수 실행
   */
  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새 AbortController 생성
      abortControllerRef.current = new AbortController();
      lastArgsRef.current = args;
      retryCountRef.current = 0;

      setLoading(true);
      clearError();

      const executeWithRetry = async (currentRetry: number): Promise<T | undefined> => {
        try {
          const result = await asyncFunction(...args);
          
          // 요청이 취소되었는지 확인
          if (abortControllerRef.current?.signal.aborted) {
            return undefined;
          }

          setData(result);
          setLoading(false);
          retryCountRef.current = 0;

          if (onSuccess) {
            onSuccess(result);
          }

          return result;
        } catch (err: any) {
          // 요청이 취소되었는지 확인
          if (abortControllerRef.current?.signal.aborted) {
            return undefined;
          }

          // 재시도 로직
          if (currentRetry < retryCount && err?.status !== 401 && err?.status !== 403) {
            retryCountRef.current = currentRetry + 1;
            logError(`재시도 ${retryCountRef.current}/${retryCount}`, err, 'useAsyncData');
            
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return executeWithRetry(currentRetry + 1);
          }

          // 재시도 실패 또는 재시도 불가능한 에러
          logError('비동기 데이터 페칭 오류', err, 'useAsyncData');
          handleError(err);
          setLoading(false);
          setData(null);

          if (onError) {
            onError(err);
          }

          return undefined;
        }
      };

      return executeWithRetry(0);
    },
    [asyncFunction, retryCount, retryDelay, handleError, clearError, onSuccess, onError]
  );

  /**
   * 재실행 (마지막 인자로)
   */
  const refetch = useCallback(() => {
    return execute(...lastArgsRef.current);
  }, [execute]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setData(null);
    setLoading(false);
    clearError();
    retryCountRef.current = 0;
    lastArgsRef.current = [];
  }, [clearError]);

  /**
   * 즉시 실행
   */
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // 클린업: 컴포넌트 언마운트 시 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate]); // execute는 의존성에 포함하지 않음 (안정적인 참조)

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    reset,
  };
}

