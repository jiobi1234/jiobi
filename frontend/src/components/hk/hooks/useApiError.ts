/**
 * 공통 API 에러 처리 Hook
 * 모든 페이지에서 일관된 에러 메시지 제공
 */

import { useState, useCallback } from 'react';
import { ApiClientError } from '../../../lib/api-client';

export interface UseApiErrorReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (err: unknown) => void;
  clearError: () => void;
}

/**
 * API 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  SERVER_ERROR: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해주세요.',
  FORBIDDEN: '접근 권한이 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다. 입력 정보를 확인해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
} as const;

/**
 * API 에러 처리 Hook
 */
export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiClientError) {
      switch (err.status) {
        case 400:
          setError(ERROR_MESSAGES.BAD_REQUEST);
          break;
        case 401:
          setError(ERROR_MESSAGES.UNAUTHORIZED);
          break;
        case 403:
          setError(ERROR_MESSAGES.FORBIDDEN);
          break;
        case 404:
          setError(ERROR_MESSAGES.NOT_FOUND);
          break;
        case 500:
        case 502:
        case 503:
          setError(ERROR_MESSAGES.SERVER_ERROR);
          break;
        case 504:
          setError(ERROR_MESSAGES.TIMEOUT);
          break;
        default:
          setError(err.detail || ERROR_MESSAGES.UNKNOWN);
      }
    } else if (err instanceof Error) {
      if (err.message.includes('network') || err.message.includes('fetch')) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(err.message || ERROR_MESSAGES.UNKNOWN);
      }
    } else {
      setError(ERROR_MESSAGES.UNKNOWN);
    }
  }, []);

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

