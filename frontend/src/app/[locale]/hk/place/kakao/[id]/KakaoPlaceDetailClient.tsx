'use client';

import { useParams } from 'next/navigation';
import HKLayout from '../../../../../../components/hk/HKLayout';

/**
 * 카카오 장소 상세 페이지 (iframe)
 * - URL: /[locale]/hk/place/kakao/[id]
 * - 카카오 place.map.kakao.com 상세를 iframe으로 띄움.
 * - 카카오에서 iframe 허용하지 않으면 빈 화면 가능 → 그때 2단계(리다이렉트)로 전환.
 */
export default function KakaoPlaceDetailClient() {
  const params = useParams();
  const id = (params?.id as string) || '';

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
