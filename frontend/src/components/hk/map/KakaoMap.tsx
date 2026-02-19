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
  /** 경유지 순서 표시용 (1, 2, 3...) */
  number?: number;
  /** 내 위치 마커 (파란 점으로 표시) */
  isMyLocation?: boolean;
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
  /** true면 마커+경로 전체가 보이도록 지도 영역 자동 조정 */
  fitToView?: boolean;
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
  fitToView = false,
  className,
  style,
  containerId: containerIdProp,
}: KakaoMapProps) {
  const generatedId = useId();
  const containerId = containerIdProp ?? `kakao-map-${generatedId.replace(/:/g, '')}`;

  const { map, isLoaded, addMarker, clearMarkers, setPolyline, setFitBounds } = useKakaoMap({
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
        number: m.number,
        isMyLocation: m.isMyLocation,
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

  // fitToView: 마커+경로 전체가 보이도록 지도 영역 조정 (내 위치 제외 - 이동 시 지도가 흔들리지 않도록)
  useEffect(() => {
    if (!isLoaded || !fitToView) return;
    const points: { lat: number; lng: number }[] = [];
    markers.filter((m) => !m.isMyLocation).forEach((m) => points.push({ lat: m.lat, lng: m.lng }));
    if (path?.length) path.forEach((p) => points.push(p));
    if (points.length === 0) return;
    // 1개일 때는 작은 패딩으로 bounds 생성 (단일 포인트도 확대 표시)
    const pts = points.length === 1
      ? [
          { lat: points[0].lat - 0.005, lng: points[0].lng - 0.005 },
          { lat: points[0].lat + 0.005, lng: points[0].lng + 0.005 },
        ]
      : points;
    setFitBounds(pts);
  }, [isLoaded, fitToView, markers, path, setFitBounds]);

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
