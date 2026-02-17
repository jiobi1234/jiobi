import { useState, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import type { ThemePlace, Theme } from '../../lib/api-client/types';

interface UseThemeManagementReturn {
  // 테마 폼 상태
  themeNameKo: string;
  setThemeNameKo: (name: string) => void;
  themeNameEn: string;
  setThemeNameEn: (name: string) => void;
  places: ThemePlace[];
  setPlaces: React.Dispatch<React.SetStateAction<ThemePlace[]>>;
  editingThemeId: string | null;
  setEditingThemeId: (id: string | null) => void;
  
  // 제출 상태
  isSubmitting: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void;
  
  // 테마 목록
  themes: Theme[];
  themesLoading: boolean;
  themesError: string | null;
  
  // 함수들
  fetchThemes: () => Promise<void>;
  handleStartEdit: (theme: Theme) => void;
  handleCancelEdit: () => void;
  handleSaveTheme: () => Promise<void>;
  handleDeleteTheme: (themeId: string) => Promise<void>;
  addPlace: (place: ThemePlace) => void;
  removePlace: (placeId: string) => void;
}

/**
 * 테마 관리(CRUD)를 위한 커스텀 훅
 * 
 * @returns 테마 관리 관련 상태 및 함수
 */
export function useThemeManagement(): UseThemeManagementReturn {
  // 테마 폼 상태
  const [themeNameKo, setThemeNameKo] = useState('');
  const [themeNameEn, setThemeNameEn] = useState('');
  const [places, setPlaces] = useState<ThemePlace[]>([]);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  
  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 테마 목록 상태
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [themesError, setThemesError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    setThemesLoading(true);
    setThemesError(null);

    try {
      const response = await apiClient.hk.getThemes();
      setThemes(response.themes || []);
    } catch (error: any) {
      console.error('테마 목록 가져오기 실패:', error);
      setThemesError(error?.message || '테마 목록을 불러오는데 실패했습니다.');
      setThemes([]);
    } finally {
      setThemesLoading(false);
    }
  }, []);

  const handleStartEdit = useCallback((theme: Theme) => {
    setThemeNameKo(theme.name_ko);
    setThemeNameEn(theme.name_en);
    setPlaces(theme.places);
    setEditingThemeId(theme.id);
    setMessage(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingThemeId(null);
    setThemeNameKo('');
    setThemeNameEn('');
    setPlaces([]);
    setMessage(null);
  }, []);

  const handleSaveTheme = useCallback(async () => {
    if (!themeNameKo || !themeNameEn || places.length === 0) {
      setMessage({ type: 'error', text: '한국어/영어 테마 이름과 최소 1개 이상의 장소를 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (editingThemeId) {
        // 수정 모드
        await apiClient.hk.updateTheme(editingThemeId, {
          name_ko: themeNameKo,
          name_en: themeNameEn,
          places: places
        });
        setMessage({ type: 'success', text: '테마가 성공적으로 수정되었습니다!' });
        handleCancelEdit();
      } else {
        // 생성 모드
        await apiClient.hk.createTheme({
          name_ko: themeNameKo,
          name_en: themeNameEn,
          places: places
        });
        setMessage({ type: 'success', text: '테마가 성공적으로 생성되었습니다!' });
        setThemeNameKo('');
        setThemeNameEn('');
        setPlaces([]);
      }
      
      // 테마 목록 새로고침
      await fetchThemes();
    } catch (error: any) {
      console.error(editingThemeId ? '테마 수정 실패' : '테마 생성 실패:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || (editingThemeId ? '테마 수정에 실패했습니다.' : '테마 생성에 실패했습니다.') + ' 다시 시도해주세요.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [themeNameKo, themeNameEn, places, editingThemeId, fetchThemes, handleCancelEdit]);

  const handleDeleteTheme = useCallback(async (themeId: string) => {
    if (!window.confirm('정말로 이 테마를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await apiClient.hk.deleteTheme(themeId);
      setMessage({ type: 'success', text: '테마가 성공적으로 삭제되었습니다!' });
      // 테마 목록 새로고침
      await fetchThemes();
    } catch (error: any) {
      console.error('테마 삭제 실패:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || '테마 삭제에 실패했습니다. 다시 시도해주세요.' 
      });
    }
  }, [fetchThemes]);

  const addPlace = useCallback((place: ThemePlace) => {
    // 이미 추가된 장소인지 확인
    const isDuplicate = places.some(p => p.place_id === place.place_id);
    if (isDuplicate) {
      setMessage({ type: 'error', text: '이미 추가된 장소입니다.' });
      return;
    }

    // 장소 추가
    setPlaces(prev => [...prev, place]);
    setMessage({ type: 'success', text: '장소가 추가되었습니다.' });
  }, [places]);

  const removePlace = useCallback((placeId: string) => {
    setPlaces(prev => prev.filter(p => p.place_id !== placeId));
  }, []);

  return {
    themeNameKo,
    setThemeNameKo,
    themeNameEn,
    setThemeNameEn,
    places,
    setPlaces,
    editingThemeId,
    setEditingThemeId,
    isSubmitting,
    message,
    setMessage,
    themes,
    themesLoading,
    themesError,
    fetchThemes,
    handleStartEdit,
    handleCancelEdit,
    handleSaveTheme,
    handleDeleteTheme,
    addPlace,
    removePlace,
  };
}

