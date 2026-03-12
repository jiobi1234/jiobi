'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import { KakaoMapScript, KakaoMap } from '../../../../../components/hk/map';
import apiClient, {
  type PlanItem,
  type Place,
  type SearchPlacesResponse,
} from '../../../../../lib/api-client';
import { getPlaceId, getPlaceImage, getPlaceTitle, getPlaceAddress } from '../../../../../utils/placeUtils';

interface ItineraryItem {
  id: string;
  place_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  image?: string;
}

export default function PlanCreatePage() {
  const router = useRouter();
  const locale = useLocale();
  const { showToast } = useToast();

  const [planTitle, setPlanTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // 지도 기반 자동 장소 탐색
  const [mapViewportCenter, setMapViewportCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapViewportBounds, setMapViewportBounds] = useState<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);
  const [mapLevel, setMapLevel] = useState<number>(6);
  const [mapRegionName, setMapRegionName] = useState<string | null>(null);
  const [mapPlaces, setMapPlaces] = useState<Place[]>([]);
  const [mapPlacesLoading, setMapPlacesLoading] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [lastExternalSearchCenter, setLastExternalSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMapPlace, setSelectedMapPlace] = useState<Place | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'cafe' | 'spot'>('all');

  // 여행 일수
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 1;
  }, [startDate, endDate]);

  const getDateForDay = (day: number): string | null => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (day - 1));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const activeDate = useMemo(() => getDateForDay(activeDay), [activeDay, startDate]);

  // Day 기준 장소들 (좌표 있는 것만)
  const dayItems = useMemo(() => {
    if (!activeDate) return [];
    return itinerary
      .filter((i) => i.date === activeDate && i.latitude != null && i.longitude != null)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [itinerary, activeDate]);

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

  // 동선 Polyline 계산
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
        setRoutePath((route.path || []).map((v) => ({ lat: v.latitude, lng: v.longitude })));
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
    return () => {
      cancelled = true;
    };
  }, [dayItems, showToast]);

  const updateItemTime = (id: string, field: 'start_time' | 'end_time', value: string) => {
    setItinerary((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setItinerary((prev) => prev.filter((item) => item.id !== id));
  };

  // 지도에서 선택한 장소 → 일정에 추가
  const handleAddFromMapPlace = (place: Place) => {
    const date = activeDate;
    if (!date) {
      showToast('error', '먼저 여행 날짜를 설정해주세요.');
      return;
    }
    const placeId = (place.place_id || place.id || '').toString();
    if (!placeId) {
      showToast('error', '이 장소는 식별자가 없어 일정을 추가할 수 없습니다.');
      return;
    }
    const title = getPlaceTitle(place);
    const address = getPlaceAddress(place);
    const id = `${placeId}-${Date.now()}-${Math.random()}`;
    setItinerary((prev) => [
      ...prev,
      {
        id,
        place_id: placeId,
        title,
        date,
        start_time: '',
        end_time: '',
        latitude: place.latitude,
        longitude: place.longitude,
        address: address || undefined,
        image: getPlaceImage(place),
      },
    ]);
  };

  // 계획 저장
  const savePlan = async () => {
    if (!planTitle || !startDate || !endDate) {
      showToast('error', '제목과 날짜를 모두 입력해주세요.');
      return;
    }
    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 계획을 저장할 수 있습니다.');
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      await apiClient.hk.createPlan({
        title: planTitle,
        start_date: startDate,
        end_date: endDate,
        items: itinerary.map<PlanItem>((i) => ({
          place_id: i.place_id,
          date: i.date,
          start_time: i.start_time || undefined,
          end_time: i.end_time || undefined,
        })),
      });
      showToast('success', '여행 계획이 저장되었습니다!');
      router.push(`/${locale}/hk/mytravel`);
    } catch (error) {
      console.error('계획 저장 중 오류:', error);
      showToast('error', '계획 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // KakaoMap onIdle → 지도 중심/레벨/뷰포트 저장
  const handleMapIdle = (info: {
    center: { lat: number; lng: number };
    level: number;
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } };
  }) => {
    setMapViewportCenter(info.center);
    setMapViewportBounds({ sw: info.bounds.sw, ne: info.bounds.ne });
    setMapLevel(info.level);

    // 중심이 이전 외부 검색 중심에서 일정 거리 이상 떨어지면 "이 지역 장소 찾기" 버튼 표시
    if (lastExternalSearchCenter) {
      const dLat = info.center.lat - lastExternalSearchCenter.lat;
      const dLng = info.center.lng - lastExternalSearchCenter.lng;
      const distanceApprox = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distanceApprox > 0.02) {
        setShowSearchThisArea(true);
      }
    } else {
      setShowSearchThisArea(true);
    }
  };

  // 1단계: DB 우선 조회 – 뷰포트 기준 우리 DB에서만 장소 가져오기
  useEffect(() => {
    if (!mapViewportBounds) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setMapPlacesLoading(true);
        const res = await apiClient.hk.searchPlacesInViewport({
          sw: mapViewportBounds.sw,
          ne: mapViewportBounds.ne,
          category: selectedCategory,
          limit: 60,
          includeExternal: false,
        });
        if (cancelled) return;
        setMapPlaces(res.places || []);
        setMapRegionName(null);
      } catch (error) {
        console.error('뷰포트 기반 DB 장소 검색 중 오류:', error);
        if (!cancelled) setMapPlaces([]);
      } finally {
        if (!cancelled) setMapPlacesLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mapViewportBounds, selectedCategory]);

  // 2단계: 사용자가 명시적으로 외부 데이터까지 요청할 때 TourAPI/Kakao 기반 검색 트리거
  const handleSearchThisArea = async () => {
    if (!mapViewportBounds || !mapViewportCenter) return;
    try {
      setMapPlacesLoading(true);
      const res = await apiClient.hk.searchPlacesInViewport({
        sw: mapViewportBounds.sw,
        ne: mapViewportBounds.ne,
        category: selectedCategory,
        limit: 80,
        includeExternal: true,
      });
      setMapPlaces(res.places || []);
      setShowSearchThisArea(false);
      setLastExternalSearchCenter(mapViewportCenter);
    } catch (error) {
      console.error('이 지역 장소 찾기 중 오류:', error);
      showToast('error', '이 지역의 장소를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setMapPlacesLoading(false);
    }
  };

  // 지도 추천 장소 카테고리 필터
  const filteredMapPlaces = useMemo(() => {
    if (!mapPlaces.length) return [];
    if (selectedCategory === 'all') return mapPlaces;

    return mapPlaces.filter((place) => {
      const cat = `${place.category || ''} ${(place.google_types || []).join(' ')}`.toLowerCase();
      if (selectedCategory === 'food') {
        return cat.includes('음식') || cat.includes('restaurant') || cat.includes('food');
      }
      if (selectedCategory === 'cafe') {
        return cat.includes('카페') || cat.includes('cafe');
      }
      return cat.includes('관광') || cat.includes('명소') || cat.includes('tour') || cat.includes('attraction');
    });
  }, [mapPlaces, selectedCategory]);

  const routeMarkers = useMemo(
    () =>
      dayItems.map((item, idx) => ({
        lat: item.latitude as number,
        lng: item.longitude as number,
        title: item.title,
        description: item.address,
        number: idx + 1,
      })),
    [dayItems],
  );

  const mapSuggestionMarkers = useMemo(
    () => {
      const base = filteredMapPlaces.filter((p) => p.latitude != null && p.longitude != null);
      if (!base.length) return [];

      // 줌 레벨에 따라 간단한 그리드 기반 클러스터링
      let cellSize = 0.002;
      if (mapLevel <= 5) cellSize = 0.02;
      else if (mapLevel <= 7) cellSize = 0.01;
      else if (mapLevel <= 9) cellSize = 0.005;

      type Cluster = { latSum: number; lngSum: number; count: number; places: Place[] };
      const clusterMap = new Map<string, Cluster>();

      base.forEach((place) => {
        const lat = place.latitude as number;
        const lng = place.longitude as number;
        const key = `${Math.floor(lat / cellSize)}_${Math.floor(lng / cellSize)}`;
        const existing = clusterMap.get(key);
        if (existing) {
          existing.latSum += lat;
          existing.lngSum += lng;
          existing.count += 1;
          existing.places.push(place);
        } else {
          clusterMap.set(key, { latSum: lat, lngSum: lng, count: 1, places: [place] });
        }
      });

      const markers: {
        lat: number;
        lng: number;
        title?: string;
        description?: string;
        onClick?: () => void;
        clusterCount?: number;
      }[] = [];

      clusterMap.forEach((cluster) => {
        const centerLat = cluster.latSum / cluster.count;
        const centerLng = cluster.lngSum / cluster.count;
        if (cluster.count === 1) {
          const place = cluster.places[0];
          markers.push({
            lat: place.latitude as number,
            lng: place.longitude as number,
            title: getPlaceTitle(place),
            description: getPlaceAddress(place),
            onClick: () => setSelectedMapPlace(place),
          });
        } else {
          markers.push({
            lat: centerLat,
            lng: centerLng,
            title: `${cluster.places[0]?.title || cluster.places[0]?.place_name || ''} 외 ${cluster.count - 1}곳`,
            description: '지도를 더 확대하면 개별 장소가 보여요.',
            clusterCount: cluster.count,
          });
        }
      });

      return markers;
    },
    [filteredMapPlaces, mapLevel],
  );

  const combinedMarkers = useMemo(
    () => [...routeMarkers, ...mapSuggestionMarkers],
    [routeMarkers, mapSuggestionMarkers],
  );

  return (
    <HKLayout>
      <div className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <HKBackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">새로운 여행 계획 만들기</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              왼쪽에서 Day별 타임라인을 관리하고, 오른쪽 지도에서 장소를 찾아 바로 추가해 보세요.
            </p>
          </div>
        </div>

        {/* 제목 / 날짜 / 저장 */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="planTitle" className="text-xs font-medium text-slate-600">
              계획 제목
            </label>
            <input
              id="planTitle"
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="예: 3박 4일 서울·수도권 미식 여행"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-xs font-medium text-slate-600">
                시작일
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <span className="pb-3 text-slate-400">~</span>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-xs font-medium text-slate-600">
                종료일
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="md:self-end">
            <button
              type="button"
              onClick={savePlan}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:bg-slate-300"
            >
              {saving ? '저장 중...' : '계획 저장'}
            </button>
          </div>
        </div>

        {/* 메인 2분할: 왼쪽 타임라인 / 오른쪽 지도 */}
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[70vh]">
          {/* 왼쪽: Day + 타임라인 */}
          <div className="lg:w-1/3 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Timeline</span>
                {activeDate && <span className="text-[11px] text-slate-500">{activeDate}</span>}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(day)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      activeDay === day
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {itinerary
                .filter((i) => i.date === activeDate)
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col items-center pt-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start gap-2">
                        {item.image && (
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{item.title}</div>
                          {item.address && (
                            <div className="text-[11px] text-slate-500 line-clamp-2">{item.address}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) => updateItemTime(item.id, 'start_time', e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <span className="text-[11px] text-slate-400">~</span>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) => updateItemTime(item.id, 'end_time', e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      aria-label="일정에서 제거"
                    >
                      ✕
                    </button>
                  </div>
                ))}

              {itinerary.filter((i) => i.date === activeDate).length === 0 && (
                <p className="text-xs text-slate-500 leading-relaxed px-1">
                  이 날짜에는 아직 일정이 없습니다.
                  <br />
                  오른쪽 지도에서 장소를 선택하고 <span className="font-semibold">일정에 추가</span> 버튼을 눌러 보세요.
                </p>
              )}
            </div>

            {routeSummary && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-600 flex items-center justify-between bg-slate-50">
                <span>총 거리 {(routeSummary.distanceMeters / 1000).toFixed(1)} km</span>
                <span>예상 이동 {Math.round(routeSummary.durationSeconds / 60)}분</span>
              </div>
            )}
          </div>

          {/* 오른쪽: 지도 + 필터 + 인포 패널 */}
          <div className="lg:w-2/3 relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
            <div className="absolute inset-x-4 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm border border-slate-200">
                <span className="text-[11px] font-medium text-slate-700">지도에서 장소 찾기</span>
                {mapRegionName && <span className="text-[10px] text-slate-400">({mapRegionName} 기준)</span>}
              </div>
              <div className="flex gap-1.5 bg-white/90 rounded-full px-1 py-1 shadow-sm border border-slate-200">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'food', label: '음식점' },
                  { id: 'cafe', label: '카페' },
                  { id: 'spot', label: '명소' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedCategory(chip.id as any)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                      selectedCategory === chip.id
                        ? 'bg-sky-600 text:white border-sky-600 shadow-sm'
                        : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex-1">
              {routeLoading && (
                <div className="pointer-events-none absolute inset-x-0 top-4 z-20 mx-auto w-max rounded-full bg-black/70 px-4 py-1.5 text-xs text-white">
                  동선을 계산하고 있어요...
                </div>
              )}
              {mapPlacesLoading && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 mx-auto w-max rounded-full bg-black/65 px-4 py-1.5 text-[11px] text-white">
                  이 주변의 주요 장소를 불러오는 중입니다...
                </div>
              )}
              {showSearchThisArea && !mapPlacesLoading && (
                <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2">
                  <button
                    type="button"
                    onClick={handleSearchThisArea}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-800 shadow-md ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    이 지역 장소 찾기
                  </button>
                </div>
              )}

              <KakaoMapScript />
              <KakaoMap
                center={mapCenter}
                level={6}
                markers={combinedMarkers}
                path={routePath || undefined}
                fitToView
                onIdle={handleMapIdle}
                className="w-full h-full"
                style={{ height: '100%' }}
              />

              {selectedMapPlace && (
                <>
                  <div
                    className="absolute inset-0 z-20 cursor-default"
                    onClick={() => setSelectedMapPlace(null)}
                    aria-hidden
                  />
                  <div
                    className="absolute left-1/2 bottom-4 z-30 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-label="지도 장소 상세"
                  >
                    <div className="flex items-start gap-3">
                      {getPlaceImage(selectedMapPlace) && (
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                          <img
                            src={getPlaceImage(selectedMapPlace)!}
                            alt={getPlaceTitle(selectedMapPlace)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {getPlaceTitle(selectedMapPlace)}
                        </div>
                        {getPlaceAddress(selectedMapPlace) && (
                          <div className="text-[11px] text-slate-500 line-clamp-2">
                            {getPlaceAddress(selectedMapPlace)}
                          </div>
                        )}
                        {selectedMapPlace.google_rating != null && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600">
                            <span>★ {selectedMapPlace.google_rating.toFixed(1)}</span>
                            {selectedMapPlace.google_ratings_total != null && (
                              <span className="text-[10px] text-slate-400">
                                ({selectedMapPlace.google_ratings_total.toLocaleString()} 리뷰)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        onClick={() => setSelectedMapPlace(null)}
                        aria-label="닫기"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          const pid = getPlaceId(selectedMapPlace);
                          if (pid) {
                            router.push(`/${locale}/hk/${pid}`);
                          }
                        }}
                      >
                        상세 보기
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                        onClick={() => {
                          handleAddFromMapPlace(selectedMapPlace);
                          setSelectedMapPlace(null);
                        }}
                      >
                        일정에 추가
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </HKLayout>
  );
}