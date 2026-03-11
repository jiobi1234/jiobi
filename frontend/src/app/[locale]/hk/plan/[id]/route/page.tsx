'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../../components/hk/HKLayout';
import { KakaoMapScript, KakaoMap, type KakaoMapMarkerData } from '../../../../../../components/hk/map';
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

interface Segment {
  from: ItineraryItem;
  to: ItineraryItem;
  index: number;
  distanceMeters?: number;
  durationSeconds?: number;
  guides?: { name?: string | null; description?: string | null; distance?: number | null }[];
  trafficLevel?: number | null;
}

export default function PlanRoutePage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const { showToast } = useToast();
  // 정적 export 환경에서는 [id]가 0으로 고정될 수 있으므로,
  // 실제 URL 경로에서 planId를 한 번 더 파싱해 보정한다.
  const [planId, setPlanId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [planTitle, setPlanTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
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

  const [segments, setSegments] = useState<Segment[]>([]);

  const routeMarkers = useMemo((): KakaoMapMarkerData[] => {
    const markers: KakaoMapMarkerData[] = dayItems.map((item, idx) => ({
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
    const activeSegment = segments[activeSegmentIndex];
    if (activeSegment && activeSegment.from.latitude != null && activeSegment.to.latitude != null) {
      return {
        lat: ((activeSegment.from.latitude as number) + (activeSegment.to.latitude as number)) / 2,
        lng: ((activeSegment.from.longitude as number) + (activeSegment.to.longitude as number)) / 2,
      };
    }
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
  }, [routePath, dayItems, segments, activeSegmentIndex]);

  const focusPoints = useMemo(() => {
    const activeSegment = segments[activeSegmentIndex];
    if (!activeSegment) return null;
    // 가능하면 백엔드에서 내려준 구간 path를 사용
    if (activeSegment.guides && activeSegment.distanceMeters && activeSegment.durationSeconds) {
      const sectionFromBackend = segments[activeSegmentIndex];
      const sectionPath = (sectionFromBackend as any).path as { latitude: number; longitude: number }[] | undefined;
      if (sectionPath && sectionPath.length > 1) {
        return sectionPath.map((p) => ({ lat: p.latitude, lng: p.longitude }));
      }
    }
    // fallback: from/to 두 점만 사용
    if (activeSegment.from.latitude != null && activeSegment.to.latitude != null) {
      return [
        { lat: activeSegment.from.latitude as number, lng: activeSegment.from.longitude as number },
        { lat: activeSegment.to.latitude as number, lng: activeSegment.to.longitude as number },
      ];
    }
    return null;
  }, [segments, activeSegmentIndex]);

  const handlePrevSegment = () => {
    setActiveSegmentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSegment = () => {
    setActiveSegmentIndex((prev) => {
      if (segments.length === 0) return 0;
      return Math.min(segments.length - 1, prev + 1);
    });
  };

  // 브라우저 URL과 동적 파라미터에서 최종 planId 결정 (최초 1회)
  useEffect(() => {
    let resolvedId: string | null = getStringParam(params, 'id');

    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      // /{locale}/hk/plan/{id}/route 구조 → planId는 인덱스 3
      if (segments.length >= 5 && segments[2] === 'plan') {
        resolvedId = segments[3];
      }
    }

    setPlanId(resolvedId || null);
  }, [params]);

  const handleOpenKakaoRouteForActiveSegment = () => {
    if (segments.length === 0) return;
    const seg = segments[activeSegmentIndex];
    if (!seg?.from.latitude || !seg?.from.longitude || !seg?.to.latitude || !seg?.to.longitude) {
      showToast('info', '이 구간의 좌표 정보가 부족해 길안내를 열 수 없습니다.');
      return;
    }
    if (typeof window === 'undefined') return;

    const url =
      `https://map.kakao.com/?` +
      `sName=${encodeURIComponent(seg.from.title)}` +
      `&sX=${encodeURIComponent(String(seg.from.longitude))}` +
      `&sY=${encodeURIComponent(String(seg.from.latitude))}` +
      `&eName=${encodeURIComponent(seg.to.title)}` +
      `&eX=${encodeURIComponent(String(seg.to.longitude))}` +
      `&eY=${encodeURIComponent(String(seg.to.latitude))}`;

    window.open(url, '_blank');
  };

  useEffect(() => {
    // planId가 아직 결정되지 않았다면 아무 것도 하지 않음
    if (!planId) return;

    const loadPlan = async () => {
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
        const pathSource = route.full_path && route.full_path.length ? route.full_path : route.path || [];
        setRoutePath(pathSource.map((v) => ({ lat: v.latitude, lng: v.longitude })));
        setRouteSummary({
          distanceMeters: route.summary?.distance_meters ?? 0,
          durationSeconds: route.summary?.duration_seconds ?? 0,
        });
        // 구간 정보가 오면 현재 Day의 dayItems와 매핑
        if (route.sections && route.sections.length && dayItems.length >= 2) {
          const mapped: Segment[] = [];
          for (let i = 0; i < dayItems.length - 1; i += 1) {
            const from = dayItems[i];
            const to = dayItems[i + 1];
            const section = route.sections.find((s) => s.from_index === i && s.to_index === i + 1);
            mapped.push({
              from,
              to,
              index: i,
              distanceMeters: section?.distance_meters,
              durationSeconds: section?.duration_seconds,
              guides: section?.guides,
              trafficLevel: section?.traffic_level ?? null,
            });
          }
          setSegments(mapped);
          setActiveSegmentIndex(0);
        } else {
          // 백엔드 구간 정보가 없으면 최소한 from/to만 채워둔다
          const fallback: Segment[] = [];
          for (let i = 1; i < dayItems.length; i += 1) {
            fallback.push({
              from: dayItems[i - 1],
              to: dayItems[i],
              index: i - 1,
            });
          }
          setSegments(fallback);
          setActiveSegmentIndex(0);
        }
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
      <div className="max-w-6xl px-4 py-8 mx-auto sm:py-10">
        <p className="text-sm text-center text-slate-600">경로 정보를 불러오는 중...</p>
      </div>
    </HKLayout>
    );
  }

  return (
    <HKLayout>
      <div className="max-w-6xl px-4 py-6 mx-auto space-y-5 sm:py-8">
        {/* 상단 헤더 */}
        <div className="space-y-2">
          <button
            type="button"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-sky-600"
            onClick={() => router.push(`/${locale}/hk/plan/${planId}`)}
          >
            ← 계획으로
          </button>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            최적 경로 보기
          </h1>
          <p className="text-sm text-slate-600">{planTitle}</p>
        </div>

        {/* Day 탭 */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              className={`px-4 py-2 text-xs font-semibold border rounded-xl transition ${
                activeDay === day
                  ? 'bg-sky-500 border-sky-500 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-700'
              }`}
              onClick={() => setActiveDay(day)}
            >
              Day {day}
            </button>
          ))}
        </div>

        {dayItems.length < 2 ? (
          <div className="px-4 py-6 text-sm text-center text-slate-600 bg-slate-50 rounded-2xl">
            해당 Day에는 장소가 2개 이상 필요합니다. 계획 편집에서 장소를 추가해 주세요.
          </div>
        ) : (
          <>
            {/* 지도 영역 */}
            <div className="relative overflow-hidden mb-4 rounded-2xl shadow-sm bg-white">
              {routeLoading && (
                <div className="absolute z-10 px-4 py-2 text-xs text-white -translate-x-1/2 bg-black/70 rounded-xl top-3 left-1/2">
                  경로를 계산하고 있어요...
                </div>
              )}
              <KakaoMapScript />
              <KakaoMap
                center={mapCenter}
                level={6}
                markers={routeMarkers}
                path={routePath || undefined}
                fitToView
                focusPoints={focusPoints || undefined}
                className="route-map"
                style={{ height: 'min(480px, 55vh)' }}
              />
            </div>
            {segments.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Day {activeDay} · {segments[activeSegmentIndex].from.title} →{' '}
                    {segments[activeSegmentIndex].to.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {segments[activeSegmentIndex].index + 1}/{segments.length} 구간
                    {segments[activeSegmentIndex].distanceMeters != null &&
                      segments[activeSegmentIndex].durationSeconds != null && (
                        <>
                          {' · '}
                          {(segments[activeSegmentIndex].distanceMeters! / 1000).toFixed(1)} km,{' '}
                          {Math.round(segments[activeSegmentIndex].durationSeconds! / 60)}분
                        </>
                      )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium border rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePrevSegment}
                    disabled={activeSegmentIndex === 0}
                  >
                    이전 구간
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-sky-500 rounded-xl hover:bg-sky-600"
                    onClick={handleOpenKakaoRouteForActiveSegment}
                  >
                    카카오 길안내
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium border rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleNextSegment}
                    disabled={segments.length === 0 || activeSegmentIndex === segments.length - 1}
                  >
                    다음 구간
                  </button>
                </div>
              </div>
            )}
            {routeSummary && (
              <div className="flex flex-wrap gap-4 px-4 py-3 text-xs font-medium text-sky-700 bg-sky-50 rounded-2xl">
                <span>총 거리: {(routeSummary.distanceMeters / 1000).toFixed(1)} km</span>
                <span>예상 소요 시간: {Math.round(routeSummary.durationSeconds / 60)}분</span>
              </div>
            )}
            {/* 경유지 리스트 */}
            <div className="pt-1">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Day {activeDay} 경유지
              </h3>
              <ol className="divide-y divide-slate-100">
                {dayItems.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 py-3 text-sm text-slate-800"
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-xl bg-sky-500">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="px-0 text-sm font-medium text-left text-slate-900 hover:text-sky-600 hover:underline"
                      onClick={() => router.push(`/${locale}/hk/${item.place_id}`)}
                    >
                      {item.title}
                    </button>
                    {item.address && (
                      <span className="ml-auto text-xs text-slate-500">
                        {item.address}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </HKLayout>
  );
}
