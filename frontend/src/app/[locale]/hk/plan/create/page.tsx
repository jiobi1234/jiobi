'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

const LOCAL_STORAGE_KEY = 'hk_plan_create_state_v1';

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

// 간단한 Haversine 거리 계산 (km 단위)
function computeDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
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

  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // 지도 뷰포트 기반 추천 장소
  const [viewportPlaces, setViewportPlaces] = useState<Place[]>([]);
  // 지도 카테고리 필터 (전체 / 음식점 / 카페 / 숙소)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'cafe' | 'stay'>('all');

  // 로컬스토리지 복원이 끝났는지 여부
  const [isHydratedFromStorage, setIsHydratedFromStorage] = useState(false);

  // 지도 & 여행 중심점
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.978 });
  const [travelCenter, setTravelCenter] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedPlaceOnMap, setSelectedPlaceOnMap] = useState<Place | null>(null);

  // 여행 일수
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 1;
  }, [startDate, endDate]);

  // 최초 진입 시, 이전에 저장된 수동 계획 작성 상태가 있으면 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      if (typeof parsed.planTitle === 'string') setPlanTitle(parsed.planTitle);
      if (typeof parsed.startDate === 'string') setStartDate(parsed.startDate);
      if (typeof parsed.endDate === 'string') setEndDate(parsed.endDate);
      if (typeof parsed.activeDay === 'number') setActiveDay(parsed.activeDay);
      if (Array.isArray(parsed.itinerary)) setItinerary(parsed.itinerary as ItineraryItem[]);
      if (Array.isArray(parsed.searchResults)) setSearchResults(parsed.searchResults as Place[]);
      if (typeof parsed.searchKeyword === 'string') setSearchKeyword(parsed.searchKeyword);
      if (parsed.mapCenter && typeof parsed.mapCenter.lat === 'number' && typeof parsed.mapCenter.lng === 'number') {
        setMapCenter(parsed.mapCenter);
      }
      if (parsed.travelCenter && typeof parsed.travelCenter.lat === 'number' && typeof parsed.travelCenter.lng === 'number') {
        setTravelCenter(parsed.travelCenter);
      }
      if (Array.isArray(parsed.viewportPlaces)) setViewportPlaces(parsed.viewportPlaces as Place[]);
      if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter);
    } catch (error) {
      console.error('수동 계획 작성 상태 복원 실패:', error);
    } finally {
      // 복원 시도(성공/실패 상관없이) 완료
      setIsHydratedFromStorage(true);
    }
  }, []);

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

  // 상태 변경 시 로컬스토리지에 현재 수동 계획 작성 상태를 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 아직 로컬스토리지에서 복원이 끝나지 않았으면 저장하지 않음
    if (!isHydratedFromStorage) return;
    try {
      const payload = {
        planTitle,
        startDate,
        endDate,
        activeDay,
        itinerary,
        searchKeyword,
        searchResults,
        mapCenter,
        travelCenter,
        viewportPlaces,
        categoryFilter,
      };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('수동 계획 작성 상태 저장 실패:', error);
    }
  }, [
    planTitle,
    startDate,
    endDate,
    activeDay,
    itinerary,
    searchKeyword,
    searchResults,
    mapCenter,
    travelCenter,
    viewportPlaces,
    categoryFilter,
    isHydratedFromStorage,
  ]);

  // 지도 중심: 여행 중심점 우선, 없으면 동선 기준
  const effectiveMapCenter = useMemo(() => {
    if (travelCenter) return travelCenter;
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
    return mapCenter;
  }, [travelCenter, routePath, dayItems, mapCenter]);

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

  // 검색 버튼 클릭 시 TourAPI+Kakao 기반 검색 (백엔드 searchPlaces 사용)
  const handleSearch = async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      showToast('info', '검색어를 입력해주세요.');
      return;
    }
    try {
      setSearchLoading(true);
      const res: SearchPlacesResponse = await apiClient.hk.searchPlaces(keyword, 1, 30);
      const places = res.places || [];

      // 여행 중심점이 이미 있으면 20km 이내 우선 정렬
      if (travelCenter) {
        const near: Place[] = [];
        const far: Place[] = [];
        places.forEach((p) => {
          if (p.latitude == null || p.longitude == null) {
            far.push(p);
            return;
          }
          const d = computeDistanceKm(
            { lat: travelCenter.lat, lng: travelCenter.lng },
            { lat: p.latitude as number, lng: p.longitude as number },
          );
          if (d <= 20) near.push(p);
          else far.push(p);
        });
        // 가까운 순으로 정렬
        near.sort((a, b) => {
          const da =
            a.latitude != null && a.longitude != null
              ? computeDistanceKm(travelCenter, { lat: a.latitude as number, lng: a.longitude as number })
              : Number.POSITIVE_INFINITY;
          const db =
            b.latitude != null && b.longitude != null
              ? computeDistanceKm(travelCenter, { lat: b.latitude as number, lng: b.longitude as number })
              : Number.POSITIVE_INFINITY;
          return da - db;
        });
        setSearchResults([...near, ...far]);
      } else {
        setSearchResults(places);
      }

      // 기준이 될 중심 좌표 (여행 중심점이 있으면 그대로 사용, 없으면 첫 검색 결과의 좌표 사용)
      let centerForRadius: { lat: number; lng: number } | null = null;
      if (travelCenter) {
        centerForRadius = travelCenter;
      } else {
        const first = places.find((p) => p.latitude != null && p.longitude != null);
        if (first) {
          centerForRadius = { lat: first.latitude as number, lng: first.longitude as number };
          // 첫 검색 시 중심 좌표를 여행 중심점으로도 설정
          setTravelCenter(centerForRadius);
        }
      }

      if (centerForRadius) {
        setMapCenter(centerForRadius);
        // 중심 좌표 기준 반경 20km 박스를 계산해서 뷰포트 검색 실행
        const radiusKm = 20;
        const latDelta = radiusKm / 111; // 위도 1도 ≒ 111km
        const lngDelta = radiusKm / (111 * Math.cos((centerForRadius.lat * Math.PI) / 180) || 1);
        const sw = {
          lat: centerForRadius.lat - latDelta,
          lng: centerForRadius.lng - lngDelta,
        };
        const ne = {
          lat: centerForRadius.lat + latDelta,
          lng: centerForRadius.lng + lngDelta,
        };
        try {
          const viewportRes = await apiClient.hk.searchPlacesInViewport({
            sw,
            ne,
            category:
              categoryFilter === 'all'
                ? 'all'
                : categoryFilter === 'stay'
                  ? 'spot'
                  : categoryFilter,
            limit: 120,
            includeExternal: true,
          });
          setViewportPlaces(viewportRes.places || []);
        } catch (viewportError) {
          console.error('검색 반경 20km 장소 로드 오류:', viewportError);
        }
      }
    } catch (error) {
      console.error('장소 검색 중 오류:', error);
      showToast('error', '장소를 검색하는 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색 결과에서 바로 Day에 추가
  const addPlaceToDay = (place: Place, dayOverride?: number) => {
    const placeId = (place.place_id || place.id || '').toString();
    if (!placeId) {
      showToast('error', '이 장소는 식별자가 없어 일정을 만들 수 없습니다.');
      return;
    }

    const day = dayOverride ?? activeDay;
    const date = getDateForDay(day);
    if (!date) {
      showToast('error', '먼저 여행 날짜를 설정해주세요.');
      return;
    }

    // 첫 장소 추가 시 여행 중심점 설정
    if (!travelCenter && place.latitude != null && place.longitude != null) {
      const center = { lat: place.latitude as number, lng: place.longitude as number };
      setTravelCenter(center);
      setMapCenter(center);
    }

    if (place.latitude != null && place.longitude != null && travelCenter) {
      const d = computeDistanceKm(travelCenter, { lat: place.latitude as number, lng: place.longitude as number });
      if (d > 20) {
        showToast('warning', '동선이 너무 멉니다. 그래도 추가합니다.');
      }
    }

    const id = `${placeId}-${Date.now()}-${Math.random()}`;
    const title = getPlaceTitle(place);
    const address = getPlaceAddress(place);

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

  // 지도 idle 시, 현재 뷰포트 기준으로 주변 장소 로드 (DB 우선 + 필요 시 외부 API)
  const handleMapIdle = useCallback(
    async (info: {
      center: { lat: number; lng: number };
      level: number;
      bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } };
    }) => {
      setMapCenter(info.center);
      // 여행 중심점이 아직 없으면 굳이 주변 장소를 많이 불러올 필요 없음
      if (!travelCenter) return;
      try {
        const res = await apiClient.hk.searchPlacesInViewport({
          sw: info.bounds.sw,
          ne: info.bounds.ne,
          category:
            categoryFilter === 'all'
              ? 'all'
              : categoryFilter === 'stay'
                ? 'spot'
                : categoryFilter,
          limit: 80,
          includeExternal: true,
        });
        setViewportPlaces(res.places || []);
      } catch (error) {
        console.error('뷰포트 기준 장소 검색 오류:', error);
      }
    },
    [travelCenter, categoryFilter],
  );

  // routeMarkers: 현재 Day 타임라인 기준 번호 마커
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

  // 검색 결과 + 지도 뷰포트 기반 스마트 마커 (카테고리 아이콘 + 라벨)
  const discoveryMarkers = useMemo(() => {
    const hasCenter = !!travelCenter;
    // 검색 결과 + 뷰포트 결과를 합치고, place_id/id 기준으로 중복 제거
    const combined: Place[] = [];
    const seen = new Set<string>();
    const pushUnique = (p: Place) => {
      const pid = (p.place_id || p.id || '').toString();
      if (!pid || seen.has(pid)) return;
      seen.add(pid);
      combined.push(p);
    };
    searchResults.forEach(pushUnique);
    viewportPlaces.forEach(pushUnique);

    const source = combined.filter((p) => p.latitude != null && p.longitude != null);

    let candidates = hasCenter
      ? source.filter((p) => {
          const d = computeDistanceKm(
            travelCenter as { lat: number; lng: number },
            { lat: p.latitude as number, lng: p.longitude as number },
          );
          return d <= 20;
        })
      : source;

    const classifyKind = (place: Place): 'food' | 'cafe' | 'stay' | 'spot' | 'other' => {
      const cat = (place.category || '').toLowerCase();
      const types = (place.google_types || []).map((t) => t.toLowerCase());

      if (cat.includes('food') || cat.includes('restaurant') || types.includes('restaurant')) return 'food';
      if (cat.includes('cafe') || types.includes('cafe')) return 'cafe';
      if (cat.includes('hotel') || cat.includes('stay') || cat.includes('accommodation') || types.includes('lodging'))
        return 'stay';
      if (cat.includes('tour') || cat.includes('spot') || types.includes('tourist_attraction')) return 'spot';
      return 'other';
    };

    // 지도 상단 카테고리 필터 적용 (전체 / 음식점 / 카페 / 숙소)
    if (categoryFilter !== 'all') {
      candidates = candidates.filter((p) => {
        const kind = classifyKind(p);
        if (categoryFilter === 'stay') return kind === 'stay';
        if (categoryFilter === 'food') return kind === 'food';
        if (categoryFilter === 'cafe') return kind === 'cafe';
        return true;
      });
    }

    return candidates.map((place) => ({
      lat: place.latitude as number,
      lng: place.longitude as number,
      title: getPlaceTitle(place),
      description: getPlaceAddress(place),
      onClick: () => setSelectedPlaceOnMap(place),
      kind: classifyKind(place),
      label: getPlaceTitle(place),
    }));
  }, [searchResults, viewportPlaces, travelCenter, categoryFilter]);

  const combinedMarkers = useMemo(
    () => [...routeMarkers, ...discoveryMarkers],
    [routeMarkers, discoveryMarkers],
  );

  return (
    <HKLayout>
      <div className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <HKBackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">수동으로 여행 계획 만들기</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              왼쪽에서 장소를 검색해 Day에 바로 추가하고, 오른쪽 지도에서 주변 장소를 보며 동선을 조정해 보세요.
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
              placeholder="예: 3박 4일 홍콩 핵심 코스"
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

        {/* 메인 2분할: 왼쪽 플래닝 패널 / 오른쪽 지도 */}
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[72vh]">
          {/* 왼쪽: 검색 + 바구니 + 타임라인 */}
          <div className="lg:w-1/3 flex flex-col gap-3">
            {/* 검색 영역 */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Search Places</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  장소명을 입력하고 검색 버튼을 눌러보세요. 첫 장소를 선택하면 그곳을 중심으로 반경 20km 이내 장소를 우선 보여줍니다.
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="예: 침사추이 전망대, 소호, 맛집"
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-400"
                  >
                    {searchLoading ? '검색 중...' : '검색'}
                  </button>
                </div>
                {/* 검색 결과 리스트 (스크롤) */}
                <div className="mt-2 max-h-56 overflow-y-auto space-y-1.5">
                  {searchResults.map((place) => {
                    const pid = (place.place_id || place.id || '').toString();
                    return (
                      <div
                        key={pid}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-slate-900">{getPlaceTitle(place)}</p>
                          {getPlaceAddress(place) && (
                            <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{getPlaceAddress(place)}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const pid = getPlaceId(place);
                              if (pid) {
                                router.push(`/${locale}/hk/${pid}`);
                              }
                            }}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                          >
                            상세정보
                          </button>
                          <button
                            type="button"
                            onClick={() => addPlaceToDay(place)}
                            className="inline-flex items-center rounded-full bg-sky-600 px-2 py-1 text-[10px] font-medium text-white shadow-sm hover:bg-sky-700"
                          >
                            Day {activeDay}에 추가
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!searchLoading && searchResults.length === 0 && (
                    <p className="py-3 text-center text-[11px] text-slate-400">검색 결과가 여기에 표시됩니다.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 타임라인 (Day 탭 + 드롭존) */}
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">타임라인</span>
                  {activeDate && <span className="text-[11px] text-slate-500">{activeDate}</span>}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setActiveDay(day)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
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
              <div className="flex-1 max-h-64 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50/60">
                {itinerary
                  .filter((i) => i.date === activeDate)
                  .map((item, idx) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex flex-col items-center pt-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start gap-2">
                          {item.image && (
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                              <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
                            {item.address && (
                              <div className="text-[10px] text-slate-500 line-clamp-2">{item.address}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={item.start_time}
                            onChange={(e) => updateItemTime(item.id, 'start_time', e.target.value)}
                            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <span className="text-[10px] text-slate-400">~</span>
                          <input
                            type="time"
                            value={item.end_time}
                            onChange={(e) => updateItemTime(item.id, 'end_time', e.target.value)}
                            className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                  <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                    이 날짜에는 아직 일정이 없습니다.
                    <br />
                    위의 검색 결과나 지도에서 마음에 드는 장소를 골라 Day에 추가해 보세요.
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
          </div>

          {/* 오른쪽: 인터랙티브 지도 */}
          <div className="lg:w-2/3 relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
            <div className="absolute inset-x-4 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm border border-slate-200">
                <span className="text-[11px] font-medium text-slate-700">인터랙티브 지도</span>
                {travelCenter && (
                  <span className="text-[10px] text-emerald-600">
                    첫 장소 기준 반경 약 20km 내에서 장소를 추천합니다.
                  </span>
                )}
              </div>
                      <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 shadow-sm border border-slate-200">
                        {[
                          { key: 'all', label: '전체' },
                          { key: 'food', label: '음식점' },
                          { key: 'cafe', label: '카페' },
                          { key: 'stay', label: '숙소' },
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setCategoryFilter(cat.key as 'all' | 'food' | 'cafe' | 'stay')}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition ${
                              categoryFilter === cat.key
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {cat.label}
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

              <KakaoMapScript />
              <KakaoMap
                center={effectiveMapCenter}
                level={7}
                markers={combinedMarkers}
                path={routePath || undefined}
                fitToView={false}
                className="w-full h-full"
                style={{ height: '100%' }}
              />

              {/* 지도 팝업: 바구니/검색 장소 상세 */}
              {selectedPlaceOnMap && (
                <>
                  <div
                    className="absolute inset-0 z-20 cursor-default"
                    onClick={() => setSelectedPlaceOnMap(null)}
                    aria-hidden
                  />
                  <div
                    className="absolute left-1/2 bottom-4 z-30 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-label="지도 장소 상세"
                  >
                    <div className="flex items-start gap-3">
                      {getPlaceImage(selectedPlaceOnMap) && (
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                          <img
                            src={getPlaceImage(selectedPlaceOnMap)!}
                            alt={getPlaceTitle(selectedPlaceOnMap)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {getPlaceTitle(selectedPlaceOnMap)}
                        </div>
                        {getPlaceAddress(selectedPlaceOnMap) && (
                          <div className="text-[11px] text-slate-500 line-clamp-2">
                            {getPlaceAddress(selectedPlaceOnMap)}
                          </div>
                        )}
                        {selectedPlaceOnMap.google_rating != null && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600">
                            <span>★ {selectedPlaceOnMap.google_rating.toFixed(1)}</span>
                            {selectedPlaceOnMap.google_ratings_total != null && (
                              <span className="text-[10px] text-slate-400">
                                ({selectedPlaceOnMap.google_ratings_total.toLocaleString()} 리뷰)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        onClick={() => setSelectedPlaceOnMap(null)}
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
                          const pid = getPlaceId(selectedPlaceOnMap);
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
                          addPlaceToDay(selectedPlaceOnMap);
                          setSelectedPlaceOnMap(null);
                        }}
                      >
                        Day {activeDay}에 추가
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

