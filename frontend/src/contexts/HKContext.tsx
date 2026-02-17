'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { HKFilterProvider, useHKFilterContext } from './HKFilterContext';
import { HKSearchProvider, useHKSearchContext } from './HKSearchContext';

import apiClient, { type Place, type WishlistItem } from '../lib/api-client';

interface HKNavigationHistory {
  category?: string;
  keyword?: string;
  scrollPosition?: number;
}

interface PlaceCache {
  [placeId: string]: Place;
}

type WishlistMap = Record<string, WishlistItem>;

interface HKContextType {
  // 네비게이션 히스토리 (이전 페이지로 돌아갈 때 상태 유지)
  navigationHistory: HKNavigationHistory;
  setNavigationHistory: (history: HKNavigationHistory) => void;
  
  // 장소 캐시 (검색 결과를 저장하여 상세 페이지에서 재사용)
  placeCache: PlaceCache;
  setPlaceCache: (cache: PlaceCache | ((prev: PlaceCache) => PlaceCache)) => void;
  getPlaceFromCache: (placeId: string) => Place | undefined;
  addPlaceToCache: (place: Place) => void;

  // 위시리스트 상태
  wishlist: WishlistMap;
  isPlaceLiked: (placeId: string) => boolean;
  setWishlist: (updater: (prev: WishlistMap) => WishlistMap) => void;
  
  // 초기화 함수
  resetContext: () => void;
  
  // 필터 Context 접근 (하위 호환성)
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  // 검색 Context 접근 (하위 호환성)
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
}

const HKContext = createContext<HKContextType | undefined>(undefined);

/**
 * HK Context 내부 컴포넌트
 * 필터와 검색 Context를 사용하여 통합 Context 제공
 */
function HKContextInner({ children }: { children: ReactNode }) {
  const { selectedCategory, setSelectedCategory } = useHKFilterContext();
  const { searchKeyword, setSearchKeyword } = useHKSearchContext();
  const [navigationHistory, setNavigationHistory] = useState<HKNavigationHistory>({});
  const [placeCache, setPlaceCache] = useState<PlaceCache>({});
  const [wishlist, setWishlistState] = useState<WishlistMap>({});

  const getPlaceFromCache = useCallback((placeId: string): Place | undefined => {
    return placeCache[placeId];
  }, [placeCache]);

  const addPlaceToCache = useCallback((place: Place) => {
    const placeId = place.place_id || place.id;
    if (placeId) {
      setPlaceCache(prev => ({ ...prev, [placeId]: place }));
    }
  }, []);

  const resetContext = useCallback(() => {
    setSelectedCategory('tourist');
    setSearchKeyword('');
    setNavigationHistory({});
    setPlaceCache({});
    setWishlistState({});
  }, [setSelectedCategory, setSearchKeyword]);

  // 위시리스트 초기 로딩 (로그인한 경우에만)
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (!apiClient.auth.isAuthenticated()) {
          setWishlistState({});
          return;
        }
        const response = await apiClient.hk.getWishlist();
        const map: WishlistMap = {};
        response.items.forEach((item) => {
          map[item.place_id] = item;
        });
        setWishlistState(map);
      } catch (error) {
        console.error('위시리스트 로딩 실패:', error);
      }
    };

    loadWishlist();
  }, []);

  const isPlaceLiked = useCallback(
    (placeId: string): boolean => {
      if (!placeId) return false;
      return !!wishlist[placeId];
    },
    [wishlist]
  );

  const setWishlist = useCallback((updater: (prev: WishlistMap) => WishlistMap) => {
    setWishlistState((prev) => updater(prev));
  }, []);

  // Context 값들을 useMemo로 메모이제이션하여 불필요한 리렌더링 방지
  const contextValue = useMemo(
    () => ({
      navigationHistory,
      setNavigationHistory,
      placeCache,
      setPlaceCache,
      getPlaceFromCache,
      addPlaceToCache,
      wishlist,
      isPlaceLiked,
      setWishlist,
      resetContext,
      // 하위 호환성을 위한 필터/검색 상태 접근
      selectedCategory,
      setSelectedCategory,
      searchKeyword,
      setSearchKeyword,
    }),
    [navigationHistory, placeCache, getPlaceFromCache, addPlaceToCache, wishlist, isPlaceLiked, setWishlist, resetContext, selectedCategory, setSelectedCategory, searchKeyword, setSearchKeyword]
  );

  return (
    <HKContext.Provider value={contextValue}>
      {children}
    </HKContext.Provider>
  );
}

/**
 * HK 통합 Provider
 * 필터, 검색, 네비게이션 히스토리를 모두 제공
 */
export function HKProvider({ children }: { children: ReactNode }) {
  return (
    <HKFilterProvider>
      <HKSearchProvider>
        <HKContextInner>
          {children}
        </HKContextInner>
      </HKSearchProvider>
    </HKFilterProvider>
  );
}

export function useHKContext() {
  const context = useContext(HKContext);
  if (context === undefined) {
    throw new Error('useHKContext must be used within a HKProvider');
  }
  return context;
}

