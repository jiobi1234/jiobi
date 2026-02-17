import KakaoPlaceDetailClient from './KakaoPlaceDetailClient';

/** output: 'export' 시 동적 세그먼트 [id]에 대해 빌드 시 생성할 경로 목록 (최소 1개 필요) */
export async function generateStaticParams() {
  return [{ id: '0' }];
}

export default function KakaoPlaceDetailPage() {
  return <KakaoPlaceDetailClient />;
}
