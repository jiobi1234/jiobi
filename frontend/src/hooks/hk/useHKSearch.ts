import { useState, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import type { Place } from '../../lib/api-client';
import { useApiError } from '../common/useApiError';
import { logError } from '../../utils/logger';

interface UseHKSearchOptions {
  initialKeyword?: string;
  initialRegion?: string;
  initialDistrict?: string;
  onPlaceCached?: (place: Place) => void;
}

interface UseHKSearchReturn {
  keyword: string;
  setKeyword: (keyword: string) => void;
  region: string;
  setRegion: (region: string) => void;
  district: string;
  setDistrict: (district: string) => void;
  places: Place[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  performSearch: (searchKeyword: string, pageNum?: number, searchRegion?: string, searchDistrict?: string) => Promise<void>;
  loadMore: () => void;
  clearResults: () => void;
}

/**
 * HK 검색 기능을 위한 커스텀 훅
 * 
 * @param options - 검색 옵션
 * @returns 검색 관련 상태 및 함수
 */
export function useHKSearch(options: UseHKSearchOptions = {}): UseHKSearchReturn {
  const { initialKeyword = '', initialRegion = '', initialDistrict = '', onPlaceCached } = options;
  
  const [keyword, setKeyword] = useState(initialKeyword);
  const [region, setRegion] = useState(initialRegion);
  const [district, setDistrict] = useState(initialDistrict);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const performSearch = useCallback(async (
    searchKeyword: string, 
    pageNum: number = 1, 
    searchRegion?: string, 
    searchDistrict?: string
  ) => {
    // 검색어나 지역 중 하나는 필수
    if (!searchKeyword.trim() && !searchRegion && !searchDistrict) {
      setPlaces([]);
      return;
    }

    setLoading(true);
    clearError();

    try {
      // API 호출 전 로깅
      console.log('검색 요청:', {
        keyword: searchKeyword,
        page: pageNum,
        region: searchRegion || region || undefined,
        district: searchDistrict || district || undefined
      });
      
      // API 엔드포인트: GET /hk/search?keyword={keyword}&page={page}&limit={limit}&region={region}&district={district}
      const response = await apiClient.hk.searchPlaces(
        searchKeyword, 
        pageNum, 
        10,
        searchRegion || region || undefined,
        searchDistrict || district || undefined
      );
      
      // 응답 데이터 확인 및 로깅
      console.log('검색 응답:', response);
      const placesData = response.places || [];
      console.log('장소 데이터:', placesData, '개수:', placesData.length);
      
      // 검색 결과를 캐시에 저장 (상세 페이지에서 재사용)
      if (onPlaceCached) {
        placesData.forEach((place: Place) => {
          onPlaceCached(place);
        });
      }
      
      if (pageNum === 1) {
        setPlaces(placesData);
      } else {
        setPlaces(prev => [...prev, ...placesData]);
      }

      setHasMore(placesData.length >= 10);
      setPage(pageNum);
      
      // 결과가 없을 때 로깅
      if (placesData.length === 0) {
        console.warn('검색 결과가 없습니다. 응답:', response);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      logError('검색 오류', err, 'useHKSearch');
      handleError(err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [region, district, handleError, clearError, onPlaceCached]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && keyword) {
      performSearch(keyword, page + 1);
    }
  }, [loading, hasMore, keyword, page, performSearch]);

  const clearResults = useCallback(() => {
    setPlaces([]);
    setPage(1);
    setHasMore(false);
    clearError();
  }, [clearError]);

  return {
    keyword,
    setKeyword,
    region,
    setRegion,
    district,
    setDistrict,
    places,
    loading,
    error,
    page,
    hasMore,
    performSearch,
    loadMore,
    clearResults,
  };
}

