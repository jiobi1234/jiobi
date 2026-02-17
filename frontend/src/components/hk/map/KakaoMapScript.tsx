'use client';

import Script from 'next/script';

const KAKAO_SDK_URL = '//dapi.kakao.com/v2/maps/sdk.js';

export interface KakaoMapScriptProps {
  /** 카카오 JavaScript 키 (미입력 시 NEXT_PUBLIC_KAKAO_API_KEY 사용) */
  appKey?: string;
  /** 스크립트 로드 후 콜백 */
  onLoad?: () => void;
}

/**
 * 카카오맵 SDK 스크립트 로더 (모듈화)
 * 페이지/레이아웃에서 한 번만 마운트하면 되며, 여러 KakaoMap 인스턴스가 같은 스크립트를 공유합니다.
 */
export default function KakaoMapScript({ appKey, onLoad }: KakaoMapScriptProps) {
  const key = appKey || process.env.NEXT_PUBLIC_KAKAO_API_KEY || '';

  return (
    <Script
      src={`${KAKAO_SDK_URL}?appkey=${key}&autoload=false`}
      strategy="lazyOnload"
      onLoad={() => {
        onLoad?.();
      }}
    />
  );
}
