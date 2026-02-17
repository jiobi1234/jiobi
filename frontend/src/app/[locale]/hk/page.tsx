'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import HKLayout from '../../../components/hk/HKLayout';
import LoadingState from '../../../components/hk/LoadingState';
import { useTravelData } from '../../../hooks/hk/useTravelData';
import { useHKContext } from '../../../contexts/HKContext';

// 코드 스플리팅: 섹션 컴포넌트들을 지연 로딩
const HeroSection = dynamic(() => import('../../../components/hk/HeroSection'), {
  loading: () => <LoadingState />,
});

const ThemesSection = dynamic(() => import('../../../components/hk/ThemesSection'), {
  loading: () => <LoadingState />,
});

const HotTravelSection = dynamic(() => import('../../../components/hk/HotTravelSection'), {
  loading: () => <LoadingState />,
});

/**
 * HK 메인 페이지 컨텐츠 컴포넌트
 * (HKProvider 내부에서 렌더링되므로 useHKContext 사용 가능)
 */
function HKMainContent() {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    navigationHistory,
    setNavigationHistory 
  } = useHKContext();
  
  const { places, loading, error, refetch } = useTravelData(selectedCategory);

  // 페이지 로드 시 네비게이션 히스토리 복원
  useEffect(() => {
    if (navigationHistory.category) {
      setSelectedCategory(navigationHistory.category);
      setNavigationHistory({}); // 복원 후 초기화
    }
  }, [navigationHistory.category, setSelectedCategory, setNavigationHistory]);

  return (
    <>
      <HeroSection />
      <ThemesSection />
      <HotTravelSection
        selectedFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        places={places}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </>
  );
}

/**
 * HK 메인 페이지
 * 
 * API 매핑:
 * - GET /hk/refresh-section/?section_type={category}&limit={limit} - 섹션 데이터 새로고침
 *   백엔드: backend/app/api/hk.py::refresh_section()
 */
export default function HKMainPage() {
  return (
    <HKLayout>
      <Suspense fallback={<LoadingState />}>
        <HKMainContent />
      </Suspense>
    </HKLayout>
  );
}

