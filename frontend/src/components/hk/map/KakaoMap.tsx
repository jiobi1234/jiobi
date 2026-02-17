'use client';

import { useId, useEffect } from 'react';
import { useKakaoMap } from '../../../hooks/hk/useKakaoMap';

export interface KakaoMapMarkerData {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  onClick?: () => void;
  day?: number;
}

export interface KakaoMapProps {
  /** 지도 중심 좌표 (기본: 서울 시청) */
  center?: { lat: number; lng: number };
  /** 확대 레벨 (기본: 3) */
  level?: number;
  /** 표시할 마커 목록 (나중에 장소 표시 시 사용) */
  markers?: KakaoMapMarkerData[];
  /** 경로(폴리라인) 좌표 목록 - 길찾기 시 사용 */
  path?: { lat: number; lng: number }[];
  /** 컨테이너 div에 줄 className */
  className?: string;
  /** 컨테이너 div에 줄 style (height 등) */
  style?: React.CSSProperties;
  /** 고정 containerId (미입력 시 useId로 자동 생성) */
  containerId?: string;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

/**
 * 카카오맵 뷰 컴포넌트 (모듈화)
 * KakaoMapScript가 먼저 로드된 상태에서 사용합니다.
 * 재사용 가능: 나의 발자취, 장소 상세 지도, 계획 지도 등에서 동일 컴포넌트 사용 가능.
 */
export default function KakaoMap({
  center = DEFAULT_CENTER,
  level = 3,
  markers = [],
  path,
  className,
  style,
  containerId: containerIdProp,
}: KakaoMapProps) {
  const generatedId = useId();
  const containerId = containerIdProp ?? `kakao-map-${generatedId.replace(/:/g, '')}`;

  const { map, isLoaded, addMarker, clearMarkers, setPolyline } = useKakaoMap({
    center,
    level,
    containerId,
  });

  useEffect(() => {
    if (!isLoaded || !markers.length) {
      clearMarkers();
      return;
    }
    clearMarkers();
    markers.forEach((m) => {
      addMarker({
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        description: m.description,
        onClick: m.onClick,
        day: m.day,
      });
    });
  }, [isLoaded, markers, addMarker, clearMarkers]);

  // 경로(폴리라인) 표시
  useEffect(() => {
    if (!isLoaded) return;
    if (!path || path.length === 0) {
      setPolyline([]);
      return;
    }
    setPolyline(path);
  }, [isLoaded, path, setPolyline]);

  // 컨테이너 크기 확정 후 지도 relayout (채팅창 내 지도가 전체 너비로 그려지도록)
  useEffect(() => {
    if (!isLoaded || !map) return;
    const t = setTimeout(() => {
      try {
        map.relayout();
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isLoaded, map]);

  return (
    <div className={className} style={{ width: '100%', ...style }}>
      <div
        id={containerId}
        style={{ width: '100%', height: '100%', minHeight: 300 }}
        aria-label="카카오맵"
      />
    </div>
  );
}
