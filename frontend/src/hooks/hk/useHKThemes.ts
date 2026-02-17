import { useState, useEffect } from 'react';
import apiClient from '../../lib/api-client';
import type { Theme } from '../../lib/api-client/types';
import { logError } from '../../utils/logger';

interface UseHKThemesReturn {
  themes: Theme[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * HK 테마 목록을 가져오는 커스텀 훅
 * 
 * @returns 테마 목록 관련 상태 및 함수
 */
export function useHKThemes(): UseHKThemesReturn {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.hk.getThemes();
      setThemes(response.themes || []);
    } catch (err: any) {
      console.error('테마 목록 가져오기 실패:', err);
      const errorMessage = err?.message || '테마를 불러오는데 실패했습니다.';
      setError(errorMessage);
      logError('테마 목록 로딩 오류', err, 'useHKThemes');
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return {
    themes,
    loading,
    error,
    refetch: fetchThemes,
  };
}

