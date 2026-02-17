'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKButton from './HKButton';
import HKRegionSelect from './HKRegionSelect';
import { useDebounce } from '../../../hooks/common/useDebounce';

interface HKSearchBarProps {
  initialKeyword?: string;
  initialRegion?: string;
  initialDistrict?: string;
  onSearch?: (keyword: string, region?: string, district?: string) => void;
  debounceMs?: number;
}

/**
 * HK 앱 전용 검색바 컴포넌트
 * 검색어 입력, 지역 선택, 검색 버튼을 포함
 * 디바운싱 지원으로 과도한 API 호출 방지
 */
export default function HKSearchBar({
  initialKeyword = '',
  initialRegion = '',
  initialDistrict = '',
  onSearch,
  debounceMs = 500,
}: HKSearchBarProps) {
  const router = useRouter();
  const locale = useLocale();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [region, setRegion] = useState(initialRegion);
  const [district, setDistrict] = useState(initialDistrict);
  
  // 디바운스된 검색어
  const debouncedKeyword = useDebounce(keyword, debounceMs);

  const handleSearch = useCallback(() => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword || region || district) {
      if (onSearch) {
        // onSearch 콜백이 있으면 사용
        onSearch(trimmedKeyword, region || undefined, district || undefined);
      } else {
        // 기본 동작: 검색 페이지로 이동
        const params = new URLSearchParams();
        if (trimmedKeyword) params.set('q', trimmedKeyword);
        if (region) params.set('region', region);
        if (district) params.set('district', district);
        const targetLocale = locale || 'ko';
        router.push(`/${targetLocale}/hk/search?${params.toString()}`);
      }
    }
  }, [keyword, region, district, onSearch, router, locale]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <>
      <div className="hk-search-bar">
        <div className="hk-search-bar__icon">🔍</div>
        <input
          type="text"
          placeholder="어디로 떠나볼까요?"
          className="hk-search-bar__input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="여행지 검색어 입력"
          aria-describedby="search-description"
        />
        <span id="search-description" className="sr-only">
          검색어와 지역을 선택하여 여행지를 검색할 수 있습니다
        </span>
        <div className="hk-search-bar__divider"></div>
        <div className="hk-search-bar__region">
          <HKRegionSelect
            region={region}
            district={district}
            onRegionChange={setRegion}
            onDistrictChange={setDistrict}
          />
        </div>
        <HKButton
          variant="solid"
          size="sm"
          onClick={handleSearch}
          className="hk-search-bar__button"
          aria-label="검색 실행"
        >
          🔍
        </HKButton>
      </div>

      <style jsx>{`
        .hk-search-bar {
          display: flex;
          align-items: center;
          background-color: white;
          border-radius: var(--hk-radius-xl);
          padding: 8px 15px;
          gap: 10px;
          flex: 1;
        }

        .hk-search-bar__icon {
          color: var(--hk-text-secondary);
          font-size: 16px;
          flex-shrink: 0;
        }

        .hk-search-bar__input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--hk-text-primary);
          background: transparent;
        }

        .hk-search-bar__input::placeholder {
          color: var(--hk-text-tertiary);
        }

        .hk-search-bar__divider {
          width: 1px;
          height: 20px;
          background-color: var(--hk-border-secondary);
          flex-shrink: 0;
        }

        .hk-search-bar__region {
          flex-shrink: 0;
        }

        .hk-search-bar__button {
          flex-shrink: 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        @media (max-width: 768px) {
          .hk-search-bar {
            padding: 6px 12px;
          }
        }
      `}</style>
    </>
  );
}

