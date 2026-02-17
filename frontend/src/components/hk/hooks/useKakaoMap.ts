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
} from '../../../types/kakao';

export interface KakaoMapMarker {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  onClick?: () => void;
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

  /**
   * 카카오맵 초기화
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = () => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) {
        console.warn('카카오맵 API가 로드되지 않았습니다.');
        return;
      }

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

    // 카카오맵 API가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      // 카카오맵 API 로드를 기다림
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          initMap();
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkKakao);
        if (!window.kakao || !window.kakao.maps) {
          console.error('카카오맵 API 로드 타임아웃');
        }
      }, 10000);
    }

    return () => {
      // 클린업: 마커 및 인포윈도우 제거
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
        const marker = new kakao.maps.Marker({
          position: position,
          title: markerData.title,
        });

        marker.setMap(map);
        markersRef.current.push(marker);

        // 인포윈도우 추가
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

          // 마커 클릭 이벤트
          kakao.maps.event.addListener(marker, 'click', () => {
            // 다른 인포윈도우 닫기
            infowindowsRef.current.forEach((iw) => iw.close());
            infowindow.open(map, marker);

            if (markerData.onClick) {
              markerData.onClick();
            }
          });
        } else if (markerData.onClick) {
          // 인포윈도우 없이 클릭 이벤트만
          kakao.maps.event.addListener(marker, 'click', markerData.onClick);
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

  return {
    map,
    isLoaded,
    addMarker,
    removeMarker,
    clearMarkers,
    setCenter,
    setLevel,
  };
}

