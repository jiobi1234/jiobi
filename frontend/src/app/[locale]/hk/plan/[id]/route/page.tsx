'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../../components/hk/HKLayout';
import { KakaoMapScript, KakaoMap } from '../../../../../../components/hk/map';
import { useToast } from '../../../../../../components/hk/common/Toast';
import apiClient, { type Plan, type PlanItem, type Place } from '../../../../../../lib/api-client';
import { getStringParam } from '../../../../../../utils/typeGuards';
import { getPlaceTitle, getPlaceAddress } from '../../../../../../utils/placeUtils';

interface ItineraryItem {
  id: string;
  place_id: string;
  title: string;
  address?: string;
  date: string;
  start_time: string;
  end_time: string;
  latitude?: number;
  longitude?: number;
}

export default function PlanRoutePage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const { showToast } = useToast();
  const planId = getStringParam(params, 'id') || '';

  const [loading, setLoading] = useState(true);
  const [planTitle, setPlanTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [startDate, endDate]);

  const getDateForDay = (day: number): string | null => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (day - 1));
    return d.toISOString().split('T')[0];
  };

  const activeDate = useMemo(() => getDateForDay(activeDay), [activeDay, startDate]);

  const dayItems = useMemo(() => {
    if (!activeDate) return [];
    return itinerary
      .filter((i) => i.date === activeDate && i.latitude != null && i.longitude != null)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [itinerary, activeDate]);

  const routeMarkers = useMemo(() => {
    const markers = dayItems.map((item, idx) => ({
      lat: item.latitude as number,
      lng: item.longitude as number,
      title: item.title,
      description: item.address,
      number: idx + 1,
    }));
    // 내 위치를 첫 번째 마커로 추가 (실시간 추적)
    if (myLocation) {
      markers.unshift({
        lat: myLocation.lat,
        lng: myLocation.lng,
        title: '내 위치',
        isMyLocation: true,
      });
    }
    return markers;
  }, [dayItems, myLocation]);

  const mapCenter = useMemo(() => {
    if (routePath && routePath.length > 0) {
      const lats = routePath.map((p) => p.lat);
      const lngs = routePath.map((p) => p.lng);
      return {
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      };
    }
    if (dayItems.length > 0) {
      return {
        lat: dayItems[0].latitude as number,
        lng: dayItems[0].longitude as number,
      };
    }
    return { lat: 37.5665, lng: 126.978 };
  }, [routePath, dayItems]);

  useEffect(() => {
    const loadPlan = async () => {
      if (!planId) {
        showToast('error', '계획 정보를 찾을 수 없습니다.');
        router.push(`/${locale}/hk/mytravel`);
        return;
      }
      try {
        setLoading(true);
        const plan: Plan = await apiClient.hk.getPlan(planId);
        setPlanTitle(plan.title || '');
        setStartDate((plan as any).start_date || '');
        setEndDate((plan as any).end_date || '');

        const items: PlanItem[] = (plan.items || []) as PlanItem[];
        const itineraryItems: ItineraryItem[] = await Promise.all(
          items.map(async (item, idx) => {
            try {
              const placeDetail: Place = await apiClient.hk.getPlaceDetail(item.place_id);
              return {
                id: `${item.place_id}-${idx}-${item.date || ''}`,
                place_id: item.place_id,
                title: getPlaceTitle(placeDetail),
                address: getPlaceAddress(placeDetail),
                date: item.date || (plan as any).start_date || '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                latitude: placeDetail.latitude,
                longitude: placeDetail.longitude,
              };
            } catch {
              return {
                id: `${item.place_id}-${idx}-${item.date || ''}`,
                place_id: item.place_id,
                title: (item as any).notes || item.place_id,
                date: item.date || (plan as any).start_date || '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
              };
            }
          })
        );
        setItinerary(itineraryItems);
      } catch (error) {
        console.error('경로 페이지 계획 로딩 오류:', error);
        showToast('error', '계획 정보를 불러오는 중 오류가 발생했습니다.');
        router.push(`/${locale}/hk/mytravel`);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [planId, locale, router, showToast]);

  useEffect(() => {
    if (dayItems.length < 2) {
      setRoutePath(null);
      setRouteSummary(null);
      return;
    }
    let cancelled = false;
    const fetchRoute = async () => {
      setRouteLoading(true);
      setRoutePath(null);
      setRouteSummary(null);
      try {
        const points = dayItems.map((i) => ({
          place_id: i.place_id,
          name: i.title,
          latitude: i.latitude as number,
          longitude: i.longitude as number,
        }));
        const route = await apiClient.hk.getRoute(points);
        if (cancelled) return;
        setRoutePath(
          (route.path || []).map((v) => ({ lat: v.latitude, lng: v.longitude }))
        );
        setRouteSummary({
          distanceMeters: route.summary?.distance_meters ?? 0,
          durationSeconds: route.summary?.duration_seconds ?? 0,
        });
      } catch (error) {
        if (cancelled) return;
        console.error('경로 조회 오류:', error);
        showToast('error', '경로를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };
    fetchRoute();
    return () => { cancelled = true; };
  }, [activeDay, activeDate, dayItems]);

  // 내 위치 실시간 추적 (경로 보기 시에만)
  useEffect(() => {
    if (dayItems.length < 2) return;
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        showToast('error', '위치 권한을 허용해 주세요. 경로 대비 이동 상황을 확인할 수 있습니다.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [dayItems.length, showToast]);

  if (loading) {
    return (
      <HKLayout>
        <div className="route-page">
          <p>경로 정보를 불러오는 중...</p>
        </div>
      </HKLayout>
    );
  }

  return (
    <HKLayout>
      <div className="route-page">
        <div className="route-header">
          <button
            type="button"
            className="route-back"
            onClick={() => router.push(`/${locale}/hk/plan/${planId}`)}
          >
            ← 계획으로
          </button>
          <h1 className="route-title">최적 경로 보기</h1>
          <p className="route-subtitle">{planTitle}</p>
        </div>

        <div className="route-day-tabs">
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              className={`route-day-tab ${activeDay === day ? 'active' : ''}`}
              onClick={() => setActiveDay(day)}
            >
              Day {day}
            </button>
          ))}
        </div>

        {dayItems.length < 2 ? (
          <div className="route-message">
            해당 Day에는 장소가 2개 이상 필요합니다. 계획 편집에서 장소를 추가해 주세요.
          </div>
        ) : (
          <>
            <div className="route-map-wrap">
              {routeLoading && (
                <div className="route-loading">경로를 계산하고 있어요...</div>
              )}
              <KakaoMapScript />
              <KakaoMap
                center={mapCenter}
                level={6}
                markers={routeMarkers}
                path={routePath || undefined}
                fitToView
                className="route-map"
                style={{ height: 'min(480px, 55vh)' }}
              />
            </div>
            {routeSummary && (
              <div className="route-summary">
                <span>총 거리: {(routeSummary.distanceMeters / 1000).toFixed(1)} km</span>
                <span>예상 소요 시간: {Math.round(routeSummary.durationSeconds / 60)}분</span>
              </div>
            )}
            <div className="route-list">
              <h3 className="route-list-title">Day {activeDay} 경유지</h3>
              <ol className="route-list-ol">
                {dayItems.map((item, idx) => (
                  <li key={item.id} className="route-list-item">
                    <span className="route-list-num">{idx + 1}</span>
                    <button
                      type="button"
                      className="route-list-name route-list-name-link"
                      onClick={() => router.push(`/${locale}/hk/${item.place_id}`)}
                    >
                      {item.title}
                    </button>
                    {item.address && (
                      <span className="route-list-addr">{item.address}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .route-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 20px;
          min-height: 100vh;
        }
        .route-header {
          margin-bottom: 24px;
        }
        .route-back {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 0.95rem;
          margin-bottom: 8px;
          padding: 0;
        }
        .route-back:hover {
          color: #1890ff;
        }
        .route-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #333;
          margin: 0 0 4px 0;
        }
        .route-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }
        .route-day-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .route-day-tab {
          padding: 10px 18px;
          border-radius: 20px;
          border: 2px solid #e0e0e0;
          background: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          color: #555;
          cursor: pointer;
        }
        .route-day-tab:hover {
          border-color: #1890ff;
          color: #1890ff;
        }
        .route-day-tab.active {
          background: #1890ff;
          border-color: #1890ff;
          color: #fff;
        }
        .route-message {
          padding: 40px 20px;
          text-align: center;
          color: #666;
          background: #f5f5f5;
          border-radius: 12px;
        }
        .route-map-wrap {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .route-loading {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          z-index: 10;
        }
        .route-summary {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: #f0f7ff;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1890ff;
        }
        .route-list-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }
        .route-list-ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .route-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .route-list-item:last-child {
          border-bottom: none;
        }
        .route-list-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1890ff;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .route-list-name {
          font-weight: 600;
          color: #333;
        }
        .route-list-name-link {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
          font: inherit;
        }
        .route-list-name-link:hover {
          color: #1890ff;
          text-decoration: underline;
        }
        .route-list-addr {
          font-size: 0.85rem;
          color: #888;
          margin-left: auto;
        }
      `}</style>
    </HKLayout>
  );
}
