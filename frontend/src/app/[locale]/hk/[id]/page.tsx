import { Suspense } from 'react';
import HKLayout from '../../../../components/hk/HKLayout';
import LoadingState from '../../../../components/hk/LoadingState';
import PlaceDetailPageContent from './PlaceDetailContent';

// 동적 파라미터 허용 (런타임에 동적으로 생성)
export const dynamicParams = true;

export async function generateStaticParams() {
  // output: 'export' 시 prerenderRoutes가 비면 "missing"으로 간주되므로 최소 1개 반환
  return [{ id: '0' }];
}

/**
 * 장소 상세 페이지
 * 
 * API 매핑:
 * - GET /hk/place/{place_id} - 장소 상세 정보 조회
 *   백엔드: backend/app/api/hk.py::get_place_detail()
 */
export default function PlaceDetailPage() {
  return (
    <HKLayout>
      <Suspense fallback={<LoadingState />}>
        <PlaceDetailPageContent />
      </Suspense>
    </HKLayout>
  );
}

