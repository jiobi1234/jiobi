'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import LoadingState from '../../../../components/hk/LoadingState';
import ErrorState from '../../../../components/hk/ErrorState';
import HKButton from '../../../../components/hk/common/HKButton';
import HKInput from '../../../../components/hk/common/HKInput';
import type { Place } from '../../../../lib/api-client';
import { useHKContext } from '../../../../contexts/HKContext';
import { useHKSearch } from '../../../../hooks/hk/useHKSearch';
import '../../../../styles/hk/search.css';

// 코드 스플리팅: PlaceCard를 지연 로딩
const PlaceCard = dynamic(() => import('../../../../components/hk/PlaceCard'), {
  loading: () => <div style={{ flex: '0 0 300px', height: '200px' }}><LoadingState /></div>,
});

/**
 * 장소 검색 페이지 컨텐츠 컴포넌트
 * (HKProvider 내부에서 렌더링되므로 useHKContext 사용 가능)
 */
function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { searchKeyword, setSearchKeyword, setNavigationHistory, addPlaceToCache } = useHKContext();
  
  const {
    keyword,
    setKeyword,
    region,
    setRegion,
    district,
    setDistrict,
    places,
    loading,
    error,
    hasMore,
    performSearch,
    loadMore,
  } = useHKSearch({
    initialKeyword: searchKeyword || searchParams.get('q') || '',
    initialRegion: searchParams.get('region') || '',
    initialDistrict: searchParams.get('district') || '',
    onPlaceCached: addPlaceToCache,
  });

  useEffect(() => {
    const urlKeyword = searchParams.get('q');
    const urlRegion = searchParams.get('region') || '';
    const urlDistrict = searchParams.get('district') || '';
    
    if (urlKeyword && urlKeyword !== keyword) {
      setKeyword(urlKeyword);
      setSearchKeyword(urlKeyword);
    }
    if (urlRegion !== region) {
      setRegion(urlRegion);
    }
    if (urlDistrict !== district) {
      setDistrict(urlDistrict);
    }
  }, [searchParams, keyword, region, district, setSearchKeyword, setKeyword, setRegion, setDistrict]);

  useEffect(() => {
    // 검색어나 지역 중 하나는 필수
    if (keyword || region || district) {
      performSearch(keyword, 1, region || undefined, district || undefined);
    }
  }, [keyword, region, district, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    setSearchKeyword(keyword);
    setNavigationHistory({ keyword });
    
    const params = new URLSearchParams();
    params.set('q', keyword.trim());
    if (region) params.set('region', region);
    if (district) params.set('district', district);
    
    router.push(`/${locale}/hk/search?${params.toString()}`);
    performSearch(keyword, 1, region || undefined, district || undefined);
  };

  const handleLoadMore = () => {
    loadMore();
  };

  const handlePlaceClick = (place: Place) => {
    // 네비게이션 히스토리 저장
    setNavigationHistory({
      keyword: keyword,
      category: undefined,
    });
    
    const placeId = place.place_id || place.id;
    if (placeId) {
      router.push(`/${locale}/hk/${placeId}`);
    }
  };

  return (
    <>
      <div className="hk-search-container">
          <div className="hk-search-header">
            <h1 className="hk-search-title">장소 검색</h1>
            <form onSubmit={handleSearch} className="hk-search-form">
              <HKInput
                type="text"
                placeholder="검색어를 입력하세요..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                fullWidth
              />
              <HKButton type="submit" variant="solid" size="md">
                검색
              </HKButton>
            </form>
          </div>

          {loading && places.length === 0 ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={() => performSearch(keyword, 1, region || undefined, district || undefined)} />
          ) : places.length > 0 ? (
            <>
              <div className="hk-search-results">
                <div className="hk-search-results-header">
                  <p className="hk-search-results-count">
                    검색 결과: {places.length}개
                    {(region || district) && (
                      <span className="hk-search-region-filter">
                        {' '}({region}{district ? ` ${district}` : ''})
                      </span>
                    )}
                  </p>
                </div>
                <div className="hk-search-places-grid">
                  {places.map((place, index) => {
                    const key = place.place_id || place.id || `place-${index}`;
                    return (
                      <PlaceCard
                        key={key}
                        place={place}
                        category=""
                        onClick={handlePlaceClick}
                      />
                    );
                  })}
                </div>
              </div>

              {hasMore && (
                <div className="hk-search-load-more">
                  <HKButton 
                    variant="outline"
                    size="md"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? '로딩 중...' : '더 보기'}
                  </HKButton>
                </div>
              )}
            </>
          ) : keyword ? (
            <div className="hk-search-no-results">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="hk-search-prompt">
              <p>위 검색창에 장소명을 입력하여 검색하세요.</p>
            </div>
          )}
        </div>
    </>
  );
}

/**
 * 장소 검색 페이지
 * 
 * API 매핑:
 * - GET /hk/search?keyword={keyword}&page={page}&limit={limit} - 장소 검색
 *   백엔드: backend/app/api/hk.py::search_places()
 */
export default function SearchPage() {
  return (
    <HKLayout>
      <Suspense fallback={<LoadingState />}>
        <SearchPageContent />
      </Suspense>
    </HKLayout>
  );
}

