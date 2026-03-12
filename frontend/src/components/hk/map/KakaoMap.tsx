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
  /** 클러스터 마커일 때 포함된 장소 수 */
  clusterCount?: number;
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
  /** 특정 구간/포인트에 포커스를 맞추기 위한 좌표 목록 (있으면 우선적으로 사용) */
  focusPoints?: { lat: number; lng: number }[] | null;
  /** 컨테이너 div에 줄 className */
  className?: string;
  /** 컨테이너 div에 줄 style (height 등) */
  style?: React.CSSProperties;
  /** 고정 containerId (미입력 시 useId로 자동 생성) */
  containerId?: string;
  /** 지도가 이동/확대·축소된 뒤 한 번씩 호출되는 콜백 (viewport 기준 장소 검색 등에 사용) */
  onIdle?: (info: {
    center: { lat: number; lng: number };
    level: number;
    bounds: {
      sw: { lat: number; lng: number };
      ne: { lat: number; lng: number };
    };
  }) => void;
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
  focusPoints = null,
  className,
  style,
  containerId: containerIdProp,
  onIdle,
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

  // 간단한 거리 계산 (Haversine 근사, km 단위)
  const computeDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
    const R = 6371; // 지구 반경 (km)
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  };

  // 경로(폴리라인) 표시
  useEffect(() => {
    if (!isLoaded) return;
    if (!path || path.length === 0) {
      setPolyline([]);
      return;
    }
    // 인접 포인트 간 거리를 계산해, 30km 이상 구간이 하나라도 있으면 경고 색상 사용
    let hasLongSegment = false;
    for (let i = 1; i < path.length; i += 1) {
      const dist = computeDistanceKm(path[i - 1], path[i]);
      if (dist >= 30) {
        hasLongSegment = true;
        break;
      }
    }
    // 기본 경로는 청록색, 장거리 구간이 있는 경우는 붉은색 계열로 표시
    const strokeColor = hasLongSegment ? '#f5222d' : '#13c2c2';
    setPolyline(path, { strokeColor });
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

  // focusPoints가 주어지면 해당 구간에 맞춰 지도를 재조정
  useEffect(() => {
    if (!isLoaded || !focusPoints || focusPoints.length === 0) return;
    setFitBounds(focusPoints);
  }, [isLoaded, focusPoints, setFitBounds]);

  // onIdle 콜백: 지도가 이동/확대·축소된 뒤 현재 중심/레벨/bounds 정보를 상위에 전달
  useEffect(() => {
    if (!isLoaded || !map || !onIdle) return;
    if (typeof window === 'undefined') return;
    const kakao = (window as any).kakao;
    if (!kakao?.maps) return;

    const handler = () => {
      try {
        // kakao.maps.Map 타입 정의에 getBounds가 없어서 any 캐스팅
        const kakaoMap = map as any;
        const centerLatLng = kakaoMap.getCenter();
        const bounds = kakaoMap.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const levelNow = kakaoMap.getLevel();
        onIdle({
          center: { lat: centerLatLng.getLat(), lng: centerLatLng.getLng() },
          level: levelNow,
          bounds: {
            sw: { lat: sw.getLat(), lng: sw.getLng() },
            ne: { lat: ne.getLat(), lng: ne.getLng() },
          },
        });
      } catch {
        // ignore
      }
    };

    kakao.maps.event.addListener(map, 'idle', handler);

    return () => {
      try {
        kakao.maps.event.removeListener(map, 'idle', handler);
      } catch {
        // ignore
      }
    };
  }, [isLoaded, map, onIdle]);

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
