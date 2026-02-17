import { useState, useEffect } from 'react';
import apiClient from '../../lib/api-client';
import { logError } from '../../utils/logger';

export interface ThemePlace {
  place_id: string;
  title: string;
  address?: string;
  image?: string;
}

export interface ThemeData {
  id: string;
  name_ko: string;
  name_en: string;
  places: ThemePlace[];
}

interface UseHKThemeReturn {
  theme: ThemeData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * HK 단일 테마 정보를 가져오는 커스텀 훅
 * 
 * @param themeId - 테마 ID
 * @returns 테마 정보 관련 상태 및 함수
 */
export function useHKTheme(themeId: string | null): UseHKThemeReturn {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTheme = async () => {
    if (!themeId) {
      setError('테마 ID가 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const themeData = await apiClient.hk.getTheme(themeId);
      setTheme(themeData);
    } catch (err: any) {
      console.error('테마 정보 가져오기 실패:', err);
      const errorMessage = err?.message || '테마를 불러오는데 실패했습니다.';
      setError(errorMessage);
      logError('테마 정보 로딩 오류', err, 'useHKTheme');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, [themeId]);

  return {
    theme,
    loading,
    error,
    refetch: fetchTheme,
  };
}

