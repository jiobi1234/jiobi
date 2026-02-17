import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import type { Place } from '../../lib/api-client';
import { useApiError } from '../common/useApiError';
import { logError } from '../../utils/logger';
import { useHKContext } from '../../contexts/HKContext';

interface UseTravelDataReturn {
  places: Place[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTravelData(category: string, limit: number = 6): UseTravelDataReturn {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();
  const { addPlaceToCache } = useHKContext();

  const loadFilteredData = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      // API 클라이언트를 사용하여 데이터 가져오기
      const data = await apiClient.hk.refreshSection(category, limit);

      // 디버깅: 실제 응답 데이터 확인
      console.log('🔍 API 응답 데이터:', data);
      console.log('🔍 카테고리:', category);

      // 백엔드 응답 형식에 따라 데이터 추출
      let placesData: Place[] = [];
      
      if (data && typeof data === 'object') {
        // 직접 places 배열이 있는 경우
        if (Array.isArray(data.places)) {
          placesData = data.places;
          console.log('✅ data.places 형식으로 데이터 추출:', placesData.length, '개');
        }
        // data.data.places 형식인 경우
        else if (data.data && Array.isArray(data.data.places)) {
          placesData = data.data.places;
          console.log('✅ data.data.places 형식으로 데이터 추출:', placesData.length, '개');
        }
        // data가 직접 배열인 경우
        else if (Array.isArray(data)) {
          placesData = data;
          console.log('✅ data가 직접 배열:', placesData.length, '개');
        }
        // 다른 형식 시도
        else {
          console.warn('⚠️ 예상하지 못한 응답 형식:', Object.keys(data));
          // 응답의 모든 키를 확인하여 places를 찾기
          for (const key of Object.keys(data)) {
            if (key.toLowerCase().includes('place') && Array.isArray(data[key])) {
              placesData = data[key];
              console.log(`✅ ${key}에서 데이터 추출:`, placesData.length, '개');
              break;
            }
          }
        }
      }

      console.log('📦 최종 placesData:', placesData.length, '개');
      if (placesData.length > 0) {
        setPlaces(placesData);
        // 각 장소를 캐시에 저장 (KakaoAPI 사용 시 상세페이지에서 재사용)
        placesData.forEach(place => {
          addPlaceToCache(place);
        });
      } else {
        setPlaces([]);
        console.warn('⚠️ 장소 데이터가 비어있습니다.');
        // 빈 결과는 에러가 아님
      }
    } catch (err) {
      console.error('❌ API 호출 오류:', err);
      logError('필터 데이터 로딩 오류', err, 'useTravelData');
      handleError(err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit, handleError, clearError, addPlaceToCache]);

  // 필터 변경 시 데이터 로딩
  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData]);

  return {
    places,
    loading,
    error,
    refetch: loadFilteredData,
  };
}

