/**
 * 공통 API 에러 처리 Hook
 * 모든 페이지에서 일관된 에러 메시지 제공 (i18n 지원)
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ApiClientError } from '../../lib/api-client';

export interface UseApiErrorReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (err: unknown) => void;
  clearError: () => void;
}

/**
 * API 에러 처리 Hook
 */
export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('errors');

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiClientError) {
      switch (err.status) {
        case 400:
          setError(t('badRequest'));
          break;
        case 401:
          setError(t('unauthorized'));
          break;
        case 403:
          setError(t('forbidden'));
          break;
        case 404:
          setError(t('notFound'));
          break;
        case 500:
        case 502:
        case 503:
          setError(t('serverError'));
          break;
        case 504:
          setError(t('timeout'));
          break;
        default:
          setError(err.detail || t('unknown'));
      }
    } else if (err instanceof Error) {
      if (err.message.includes('network') || err.message.includes('fetch')) {
        setError(t('networkError'));
      } else {
        setError(err.message || t('unknown'));
      }
    } else {
      setError(t('unknown'));
    }
  }, [t]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
}

