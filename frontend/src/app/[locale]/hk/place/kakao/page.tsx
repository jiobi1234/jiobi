'use client';

import { useSearchParams } from 'next/navigation';
import HKLayout from '../../../../../components/hk/HKLayout';

/**
 * 카카오 장소 상세 페이지 (iframe) - 쿼리스트링 버전
 * - URL: /[locale]/hk/place/kakao?id={kakao_place_id}
 * - 정적 export 환경에서도 모든 id에 대해 동작 가능 (쿼리스트링은 정적 파일 존재 여부에 영향 없음)
 */
export default function KakaoPlaceDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';

  if (!id) {
    return (
      <HKLayout>
        <div className="flex min-h-[400px] items-center justify-center text-gray-500">
          장소 정보를 찾을 수 없습니다.
        </div>
      </HKLayout>
    );
  }

  const kakaoPlaceUrl = `https://place.map.kakao.com/${id}`;

  return (
    <HKLayout>
      <div className="flex w-full flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <iframe
          title="카카오 장소 상세"
          src={kakaoPlaceUrl}
          className="w-full flex-1 border-0"
          style={{ minHeight: '600px' }}
          allow="fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </HKLayout>
  );
}

