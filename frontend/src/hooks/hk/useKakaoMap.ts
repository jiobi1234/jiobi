/**
 * 카카오맵 커스텀 훅
 * 카카오맵 초기화 및 마커 관리 로직을 재사용 가능한 훅으로 추출
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  KakaoMap,
  KakaoMapOptions,
  KakaoMarker,
  KakaoInfoWindow,
  KakaoLatLng,
} from '../../types/kakao';

export interface KakaoMapMarker {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  onClick?: () => void;
  day?: number; // Day별 마커 색상 구분용
  number?: number; // 경유지 순서 (1, 2, 3...) - 번호 마커
  isMyLocation?: boolean; // 내 위치 마커 (파란 점)
}

export interface UseKakaoMapOptions {
  center?: { lat: number; lng: number };
  level?: number;
  containerId?: string;
  onMapLoad?: (map: KakaoMap) => void;
}

export interface UseKakaoMapReturn {
  map: KakaoMap | null;
  isLoaded: boolean;
  addMarker: (marker: KakaoMapMarker) => void;
  removeMarker: (index: number) => void;
  clearMarkers: () => void;
  setCenter: (lat: number, lng: number) => void;
  setLevel: (level: number) => void;
  setPolyline: (points: { lat: number; lng: number }[]) => void;
  /** 모든 포인트가 보이도록 지도 영역 조정 */
  setFitBounds: (points: { lat: number; lng: number }[], padding?: number) => void;
}

/**
 * 카카오맵 훅
 * @param options - 카카오맵 옵션
 */
export function useKakaoMap(options: UseKakaoMapOptions = {}): UseKakaoMapReturn {
  const {
    center = { lat: 37.5665, lng: 126.9780 },
    level = 3,
    containerId = 'kakao-map',
    onMapLoad,
  } = options;

  const [map, setMap] = useState<KakaoMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infowindowsRef = useRef<KakaoInfoWindow[]>([]);
  const mapRef = useRef<KakaoMap | null>(null);
  const initDoneRef = useRef(false);
  const polylineRef = useRef<any | null>(null);

  /**
   * 카카오맵 초기화
   * autoload=false 인 경우 반드시 kakao.maps.load(콜백) 안에서 지도를 생성해야 함.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initMap = () => {
      const kakao = window.kakao;
      if (!kakao?.maps) return;

      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`컨테이너를 찾을 수 없습니다: ${containerId}`);
        return;
      }

      try {
        const mapOption: KakaoMapOptions = {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: level,
        };

        const kakaoMap = new kakao.maps.Map(container, mapOption);
        if (cancelled) return;
        initDoneRef.current = true;
        mapRef.current = kakaoMap;
        setMap(kakaoMap);
        setIsLoaded(true);

        if (onMapLoad) {
          onMapLoad(kakaoMap);
        }
      } catch (error) {
        console.error('카카오맵 초기화 실패:', error);
      }
    };

    const runWhenReady = () => {
      const kakao = window.kakao;
      if (!kakao) return false;
      // autoload=false 이므로 maps 모듈이 준비될 때까지 load(콜백) 사용
      kakao.maps.load(() => {
        if (cancelled) return;
        initMap();
      });
      return true;
    };

    if (window.kakao) {
      runWhenReady();
    } else {
      intervalId = setInterval(() => {
        if (!window.kakao) return;
        if (runWhenReady() && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 100);

      timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        if (!initDoneRef.current && !cancelled) {
          console.error('카카오맵 API 로드 타임아웃. NEXT_PUBLIC_KAKAO_API_KEY 확인 및 카카오 디벨로퍼스 앱 키(JavaScript 키) 사용 여부를 확인하세요.');
        }
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      markersRef.current.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      markersRef.current = [];
      infowindowsRef.current = [];
    };
  }, [containerId, center.lat, center.lng, level, onMapLoad]);

  /**
   * 마커 추가
   */
  const addMarker = useCallback(
    (markerData: KakaoMapMarker) => {
      if (!map || typeof window === 'undefined') return;

      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      try {
        const position = new kakao.maps.LatLng(markerData.lat, markerData.lng);
        const maps = kakao.maps as any;

        // Day별 마커 색상 팔레트
        let markerOptions: any = {
          position: position,
          title: markerData.title,
        };

        if (markerData.isMyLocation) {
          // 내 위치: 파란 점 + 바깥 원 (네이버/카카오맵 스타일)
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#1890ff" fill-opacity="0.2" stroke="#1890ff" stroke-width="2"/>
              <circle cx="20" cy="20" r="6" fill="#1890ff" stroke="#ffffff" stroke-width="2"/>
            </svg>
          `;
          const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
          const size = new maps.Size(40, 40);
          const offset = new maps.Point(20, 20);
          const image = new maps.MarkerImage(src, size, { offset });
          markerOptions.image = image;
        } else if (markerData.number != null) {
          const num = String(markerData.number);
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="#1890ff" stroke="#ffffff" stroke-width="2"/>
              <text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold" font-family="sans-serif">${num}</text>
            </svg>
          `;
          const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
          const size = new maps.Size(32, 32);
          const offset = new maps.Point(16, 16);
          const image = new maps.MarkerImage(src, size, { offset });
          markerOptions.image = image;
        } else if (markerData.day != null) {
          const colors = ['#ff4d4f', '#fa8c16', '#fadb14', '#52c41a', '#1890ff', '#722ed1'];
          const color = colors[(Math.max(1, markerData.day) - 1) % colors.length];
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="12" r="8" fill="${color}" stroke="#ffffff" stroke-width="2"/>
              <path d="M16 20 L12 30 L16 28 L20 30 Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
            </svg>
          `;
          const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
          const size = new maps.Size(32, 32);
          const offset = new maps.Point(16, 32);
          const image = new maps.MarkerImage(src, size, { offset });
          markerOptions.image = image;
        }

        const marker = new maps.Marker(markerOptions);

        marker.setMap(map);
        markersRef.current.push(marker);

        // 커스텀 onClick이 있으면 인포윈도우 없이 클릭만 처리 (상위에서 카드/팝업 등으로 표시)
        if (markerData.onClick) {
          kakao.maps.event.addListener(marker, 'click', markerData.onClick);
          return;
        }

        // onClick 없을 때만 카카오 인포윈도우 표시 (제목/설명 있는 경우)
        if (markerData.title || markerData.description) {
          const content = `
            <div style="padding:8px; font-size:14px; font-weight:500;">
              ${markerData.title || ''}
              ${markerData.description ? `<br><span style="color:#666; font-size:12px;">${markerData.description}</span>` : ''}
            </div>
          `;

          const infowindow = new kakao.maps.InfoWindow({
            content: content,
          });

          infowindowsRef.current.push(infowindow);

          kakao.maps.event.addListener(marker, 'click', () => {
            infowindowsRef.current.forEach((iw) => iw.close());
            infowindow.open(map, marker);
          });
        }
      } catch (error) {
        console.error('마커 추가 실패:', error);
      }
    },
    [map]
  );

  /**
   * 마커 제거
   */
  const removeMarker = useCallback((index: number) => {
    if (index < 0 || index >= markersRef.current.length) return;

    const marker = markersRef.current[index];
    if (marker) {
      marker.setMap(null);
      markersRef.current.splice(index, 1);
    }

    if (index < infowindowsRef.current.length) {
      infowindowsRef.current.splice(index, 1);
    }
  }, []);

  /**
   * 모든 마커 제거
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      if (marker) marker.setMap(null);
    });
    markersRef.current = [];
    infowindowsRef.current = [];
  }, []);

  /**
   * 경로(폴리라인) 설정/초기화
   */
  const setPolyline = useCallback(
    (points: { lat: number; lng: number }[]) => {
      if (!map || typeof window === 'undefined') return;

      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      try {
        // 기존 폴리라인 제거
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        if (!points.length) {
          return;
        }

        const path = points.map(
          (p) => new kakao.maps.LatLng(p.lat, p.lng)
        );

        const polyline = new kakao.maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: '#1890ff',
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
        });

        polyline.setMap(map);
        polylineRef.current = polyline;
      } catch (error) {
        console.error('폴리라인 설정 실패:', error);
      }
    },
    [map]
  );

  /**
   * 지도 중심 설정
   */
  const setCenter = useCallback(
    (lat: number, lng: number) => {
      if (!map || typeof window === 'undefined') return;

      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      const moveLatLon = new kakao.maps.LatLng(lat, lng);
      map.setCenter(moveLatLon);
    },
    [map]
  );

  /**
   * 지도 레벨 설정
   */
  const setLevel = useCallback(
    (newLevel: number) => {
      if (!map) return;
      map.setLevel(newLevel);
    },
    [map]
  );

  /**
   * 모든 포인트가 보이도록 지도 영역 조정
   */
  const setFitBounds = useCallback(
    (points: { lat: number; lng: number }[], padding: number = 50) => {
      if (!map || typeof window === 'undefined' || !points.length) return;

      const kakao = window.kakao;
      if (!kakao?.maps) return;

      try {
        const bounds = new kakao.maps.LatLngBounds();
        points.forEach((p) => {
          bounds.extend(new kakao.maps.LatLng(p.lat, p.lng));
        });
        map.setBounds(bounds, padding, padding, padding, padding);
      } catch (error) {
        console.error('setFitBounds 실패:', error);
      }
    },
    [map]
  );

  return {
    map,
    isLoaded,
    addMarker,
    removeMarker,
    clearMarkers,
    setCenter,
    setLevel,
    setPolyline,
    setFitBounds,
  };
}

