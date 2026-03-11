'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useToast } from '../../../../../components/hk/common/Toast';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import HKSearchBar from '../../../../../components/hk/common/HKSearchBar';
import { KakaoMapScript, KakaoMap } from '../../../../../components/hk/map';
import apiClient, { type Plan, type WishlistItem, type PlanItem, type Place, type SearchPlacesResponse } from '../../../../../lib/api-client';
import { getStringParam } from '../../../../../utils/typeGuards';
import { getPlaceTitle, getPlaceAddress, getPlaceImage, getPlaceId } from '../../../../../utils/placeUtils';

interface ItineraryItem {
  id: string;
  place_id: string;
  title: string;
  address?: string;
  image?: string;
  date: string;
  start_time: string;
  end_time: string;
  // 지도 표시용 좌표 (프론트 전용)
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export default function PlanDetailContent() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const { showToast } = useToast();

  const planId = getStringParam(params, 'id') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchMode, setSearchMode] = useState<'search' | 'wishlist'>('search');
  const [activeDay, setActiveDay] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);
  const [kakaoRouteUrl, setKakaoRouteUrl] = useState<string | null>(null);
  const [routeLoadingDay, setRouteLoadingDay] = useState<number | null>(null);

  // 여행 일수 계산
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

  // 날짜 → Day 번호 (1, 2, 3...)
  const getDayForDate = (dateStr: string): number => {
    if (!startDate || !dateStr) return 1;
    const s = new Date(startDate);
    const d = new Date(dateStr);
    const diff = Math.floor((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  // 지도용 마커: 모든 일정(전체 Day) 표시, Day별 색상 (자동 계획과 동일)
  const planMapMarkers = useMemo(() => {
    const withCoords = itinerary.filter((i) => i.latitude != null && i.longitude != null);
    if (!startDate) return [];
    const byDate = [...withCoords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return byDate.map((i) => {
      const day = getDayForDate(i.date);
      return {
        lat: i.latitude as number,
        lng: i.longitude as number,
        day,
        title: `Day ${day} · ${i.title}`,
        description: i.address
          ? `${i.address}${i.start_time || i.end_time ? `\n${i.start_time || ''} ~ ${i.end_time || ''}` : ''}`
          : i.start_time || i.end_time
            ? `${i.start_time || ''} ~ ${i.end_time || ''}`
            : '',
        onClick: () => setSelectedItemId(i.id),
      };
    });
  }, [itinerary, startDate]);

  const planMapCenter =
    planMapMarkers.length > 0
      ? { lat: planMapMarkers[0].lat, lng: planMapMarkers[0].lng }
      : { lat: 37.5665, lng: 126.978 };

  // Day별 길찾기 (자동 계획과 동일)
  const handleShowRouteForDay = async (dayNumber: number) => {
    const dateStr = getDateForDay(dayNumber);
    if (!dateStr) return;
    const dayItems = itinerary.filter(
      (i) => i.date === dateStr && i.latitude != null && i.longitude != null,
    );
    if (dayItems.length < 2) {
      showToast('info', '해당 Day에는 길찾기를 위한 최소 2개 이상의 장소가 필요합니다.');
      return;
    }
    try {
      setRouteLoadingDay(dayNumber);
      setRoutePath(null);
      setRouteSummary(null);
      setKakaoRouteUrl(null);

      const points = dayItems.map((i) => ({
        place_id: i.place_id,
        name: i.title,
        latitude: i.latitude as number,
        longitude: i.longitude as number,
      }));

      const route = await apiClient.hk.getRoute(points);
      const path = (route.path || []).map((v) => ({
        lat: v.latitude,
        lng: v.longitude,
      }));

      setRoutePath(path);
      setRouteSummary({
        distanceMeters: route.summary?.distance_meters ?? 0,
        durationSeconds: route.summary?.duration_seconds ?? 0,
      });

      const start = dayItems[0];
      const end = dayItems[dayItems.length - 1];
      const kakaoUrl =
        `https://map.kakao.com/?sName=${encodeURIComponent(start.title || '')}` +
        `&sX=${encodeURIComponent(String(start.longitude))}` +
        `&sY=${encodeURIComponent(String(start.latitude))}` +
        `&eName=${encodeURIComponent(end.title || '')}` +
        `&eX=${encodeURIComponent(String(end.longitude))}` +
        `&eY=${encodeURIComponent(String(end.latitude))}`;
      setKakaoRouteUrl(kakaoUrl);
    } catch (error) {
      console.error('수동 계획 길찾기 오류:', error);
      showToast('error', '길찾기 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRouteLoadingDay(null);
    }
  };

  // 개별 장소 클릭 시: 현재 위치 → 해당 장소까지 카카오 길찾기 iframe 갱신
  const handlePlaceClickForRoute = (item: ItineraryItem) => {
    if (!item.latitude || !item.longitude) {
      showToast('info', '이 장소의 좌표를 찾을 수 없어 길찾기를 표시할 수 없습니다.');
      return;
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      showToast('error', '브라우저에서 현재 위치를 가져올 수 없습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fromLat = pos.coords.latitude;
        const fromLng = pos.coords.longitude;
        const startName = '현재 위치';
        const destName = item.title || '목적지';

        const url =
          `https://map.kakao.com/link/route/` +
          `${encodeURIComponent(startName)},${fromLat},${fromLng},` +
          `${encodeURIComponent(destName)},${item.latitude},${item.longitude}`;

        setSelectedItemId(item.id);
        setRoutePath(null);
        setRouteSummary(null);
        setKakaoRouteUrl(url);
      },
      () => {
        showToast('error', '현재 위치를 가져올 수 없습니다. 위치 권한을 허용했는지 확인해주세요.');
      },
    );
  };

  // 계획 및 위시리스트 로딩
  useEffect(() => {
    const loadPlanAndWishlist = async () => {
      if (!planId) {
        showToast('error', '계획 ID가 올바르지 않습니다.');
        router.push(`/${locale}/hk/mytravel`);
        return;
      }

      try {
        setLoading(true);
        // 계획 로딩
        const plan: Plan = await apiClient.hk.getPlan(planId);
        setPlanTitle(plan.title || '');
        setStartDate((plan as any).start_date || '');
        setEndDate((plan as any).end_date || '');

        const items: PlanItem[] = (plan.items || []) as PlanItem[];

        // 각 장소의 상세 정보를 가져오기
        const loadPlaceDetails = async () => {
          const itineraryItems: ItineraryItem[] = await Promise.all(
            items.map(async (item, idx) => {
              try {
                // place_id로 장소 상세 정보 조회
                const placeDetail: Place = await apiClient.hk.getPlaceDetail(item.place_id);
                return {
                  id: `${item.place_id}-${idx}-${item.date || ''}`,
                  place_id: item.place_id,
                  title: getPlaceTitle(placeDetail),
                  address: getPlaceAddress(placeDetail),
                  image: getPlaceImage(placeDetail),
                  date: item.date || startDate || '',
                  start_time: item.start_time || '',
                  end_time: item.end_time || '',
                  latitude: placeDetail.latitude,
                  longitude: placeDetail.longitude,
                  notes: item.notes,
                };
              } catch (error) {
                console.error(`장소 정보 로딩 실패 (${item.place_id}):`, error);
                // 실패 시 기본값 사용
                return {
                  id: `${item.place_id}-${idx}-${item.date || ''}`,
                  place_id: item.place_id,
                  // 자동 계획에서 저장된 notes(원래 장소 이름)가 있으면 우선 사용
                  title: item.notes || item.place_id,
                  date: item.date || startDate || '',
                  start_time: item.start_time || '',
                  end_time: item.end_time || '',
                };
              }
            })
          );
          setItinerary(itineraryItems);
        };

        await loadPlaceDetails();

        // 위시리스트 로딩 (로그인한 경우)
        if (apiClient.auth.isAuthenticated()) {
          setLoadingWishlist(true);
          const res = await apiClient.hk.getWishlist();
          setWishlist(res.items || []);
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error('계획 로딩 중 오류:', error);
        showToast('error', '계획 정보를 불러오는 중 오류가 발생했습니다.');
        router.push(`/${locale}/hk/mytravel`);
      } finally {
        setLoading(false);
        setLoadingWishlist(false);
      }
    };

    loadPlanAndWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const updateItemTime = (id: string, field: 'start_time' | 'end_time', value: string) => {
    setItinerary(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItinerary(prev => prev.filter(item => item.id !== id));
    setSelectedItemId((prev) => (prev === id ? null : prev));
  };

  const handleAddFromWishlist = (item: WishlistItem) => {
    const date = activeDate;
    if (!date) {
      showToast('error', '먼저 여행 날짜를 설정해주세요.');
      return;
    }
    const id = `${item.place_id}-${Date.now()}-${Math.random()}`;
    setItinerary(prev => [
      ...prev,
      {
        id,
        place_id: item.place_id,
        title: item.title,
        date,
        start_time: '',
        end_time: '',
      },
    ]);
  };

  const handleAddFromSearchResult = (place: Place) => {
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

    const title =
      (place.title as string) ||
      (place.place_name as string) ||
      '장소';

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
      },
    ]);
  };

  const handleSearchPlaces = async (keyword: string, region?: string, district?: string) => {
    const trimmed = keyword.trim();
    if (!trimmed && !region && !district) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const res: SearchPlacesResponse = await apiClient.hk.searchPlaces(
        trimmed,
        1,
        20,
        region,
        district
      );
      setSearchResults(res.places || []);
    } catch (error) {
      console.error('장소 검색 중 오류:', error);
      showToast('error', '장소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectedItem = useMemo(
    () => itinerary.find((i) => i.id === selectedItemId) || null,
    [itinerary, selectedItemId]
  );

  const handleSave = async () => {
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
      await apiClient.hk.updatePlan(planId, {
        title: planTitle,
        start_date: startDate,
        end_date: endDate,
        items: itinerary.map<PlanItem>((i) => ({
          place_id: i.place_id,
          date: i.date,
          start_time: i.start_time || undefined,
          end_time: i.end_time || undefined,
          // 제목이 숫자 ID가 아니라 사람이 읽을 수 있는 이름이 되도록 notes에도 저장
          notes: i.title,
        })),
      });
      showToast('success', '여행 계획이 수정되었습니다!');
      router.push(`/${locale}/hk/mytravel`);
    } catch (error) {
      console.error('계획 수정 중 오류:', error);
      showToast('error', '계획 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!planId) return;

    const confirmDelete = window.confirm('이 여행 계획을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 계획을 삭제할 수 있습니다.');
      return;
    }

    try {
      const result = await apiClient.hk.deletePlan(planId);
      if (result.success) {
        showToast('success', '여행 계획이 삭제되었습니다.');
        router.push(`/${locale}/hk/mytravel`);
      } else {
        showToast('error', '계획을 찾을 수 없거나 삭제할 수 없습니다.');
      }
    } catch (error) {
      console.error('계획 삭제 중 오류:', error);
      showToast('error', '계획 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl px-4 py-10 mx-auto">
        <p className="text-sm text-center text-slate-600">
          계획 정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl px-4 py-6 mx-auto space-y-6 sm:py-8">
      {/* 헤더 */}
      <div className="flex flex-col items-center gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
        <HKBackButton />
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          여행 계획 편집하기
        </h1>
      </div>

      {/* 제목 / 날짜 / 액션 */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          id="planTitle"
          className="flex-1 min-w-[220px] px-3 py-2 text-sm border rounded-xl border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:bg-white"
          placeholder="여행 계획의 제목을 입력하세요"
          value={planTitle}
          onChange={(e) => setPlanTitle(e.target.value)}
        />
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="date"
            id="startDate"
            className="px-2.5 py-2 text-xs border rounded-lg border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:bg-white"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            id="endDate"
            className="px-2.5 py-2 text-xs border rounded-lg border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:bg-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 메인 영역: 좌 검색 / 우 일정 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 왼쪽: 검색 / 위시리스트 */}
        <div className="flex flex-col h-[520px] rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
          <div className="flex mb-3 text-xs font-semibold text-slate-600 border-b border-slate-100">
            <button
              type="button"
              className={`flex-1 pb-2 border-b-2 ${
                searchMode === 'search'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-400'
              }`}
              onClick={() => setSearchMode('search')}
            >
              검색으로 추가
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 border-b-2 ${
                searchMode === 'wishlist'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-400'
              }`}
              onClick={() => setSearchMode('wishlist')}
            >
              위시리스트로 추가
            </button>
          </div>

          {searchMode === 'search' && (
            <>
              <div className="mb-3">
                <HKSearchBar
                  initialKeyword=""
                  onSearch={handleSearchPlaces}
                  debounceMs={400}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
                {loadingSearch ? (
                  <p className="text-slate-500">장소를 검색하는 중입니다...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-slate-500">
                    검색 결과가 없습니다. 검색어 또는 지역을 바꿔보세요.
                  </p>
                ) : (
                  searchResults.map((place) => {
                    const placeId = getPlaceId(place);
                    const image = getPlaceImage(place);
                    const title =
                      (place.title as string) ||
                      (place.place_name as string) ||
                      '장소';
                    const address =
                      (place.address as string) ||
                      (place.address_name as string) ||
                      place.addr1 ||
                      '';

                    return (
                      <div
                        key={placeId}
                        className="flex items-center p-2 border rounded-xl cursor-pointer border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"
                        onClick={() => {
                          if (placeId) {
                            router.push(`/${locale}/hk/${placeId}`);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center flex-shrink-0 w-11 h-11 mr-3 overflow-hidden rounded-lg bg-slate-100">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt={title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-lg">📍</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                            {address}
                          </div>
                        </div>
                        <button
                          type="button"
                        className="flex items-center justify-center w-7 h-7 ml-2 text-base text-white rounded-2xl bg-slate-500 hover:bg-sky-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFromSearchResult(place);
                          }}
                        >
                          +
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {searchMode === 'wishlist' && (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs">
              {loadingWishlist ? (
                <p className="text-slate-500">위시리스트를 불러오는 중입니다...</p>
              ) : wishlist.length === 0 ? (
                <p className="text-slate-500">위시리스트에 저장된 장소가 없습니다.</p>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center p-2 border rounded-xl cursor-pointer border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"
                    onClick={() => {
                      if (item.place_id) {
                        router.push(`/${locale}/hk/${item.place_id}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-11 h-11 mr-3 overflow-hidden rounded-lg bg-slate-100">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-lg">📍</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {item.address || ''}
                      </div>
                    </div>
                    <button
                      type="button"
                        className="flex items-center justify-center w-7 h-7 ml-2 text-base text-white rounded-2xl bg-slate-500 hover:bg-sky-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFromWishlist(item);
                      }}
                    >
                      +
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 일정 리스트 */}
        <div className="flex flex-col h-[520px] rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
              <button
                key={day}
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold border rounded-2xl transition ${
                  activeDay === day
                    ? 'bg-sky-500 border-sky-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-700'
                }`}
                onClick={() => setActiveDay(day)}
              >
                Day {day}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 text-xs space-y-2">
            {itinerary
              .filter((i) => i.date === activeDate)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center p-2 border rounded-xl cursor-move border-slate-200 hover:border-sky-400 hover:bg-sky-50/40"
                  draggable
                  onClick={() => handlePlaceClickForRoute(item)}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={() => {
                    if (!draggingId || draggingId === item.id) return;
                    setItinerary((prev) => {
                      const fromIndex = prev.findIndex((i) => i.id === draggingId);
                      const toIndex = prev.findIndex((i) => i.id === item.id);
                      if (fromIndex === -1 || toIndex === -1) return prev;
                      if (prev[fromIndex].date !== prev[toIndex].date) return prev;
                      const next = [...prev];
                      const [moved] = next.splice(fromIndex, 1);
                      next.splice(toIndex, 0, moved);
                      return next;
                    });
                    setDraggingId(null);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <span className="flex items-center justify-center w-5 h-10 mr-2 text-slate-400">
                    ⋮⋮
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="time"
                        value={item.start_time}
                        className="px-2 py-1 text-[11px] border rounded-lg border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                        onChange={(e) => {
                          e.stopPropagation();
                          updateItemTime(item.id, 'start_time', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={item.end_time}
                        className="px-2 py-1 text-[11px] border rounded-lg border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                        onChange={(e) => {
                          e.stopPropagation();
                          updateItemTime(item.id, 'end_time', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="px-2 py-1 text-[11px] font-medium border rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${locale}/hk/${item.place_id}`);
                        }}
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center w-7 h-7 ml-2 text-xs text-white rounded-2xl bg-slate-500 hover:bg-rose-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            {itinerary.filter((i) => i.date === activeDate).length === 0 && (
              <p className="mt-4 text-xs text-center text-slate-500">
                이 날짜에는 추가된 일정이 없습니다. 위시리스트에서 장소를 추가해보세요.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 지도 섹션 */}
      <div className="p-4 mt-2 bg-white border rounded-2xl border-slate-100 shadow-sm">
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
            지도에서 보기
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="px-4 py-1.5 text-xs font-semibold text-sky-600 border border-sky-500 rounded-2xl hover:bg-sky-50"
              onClick={() => router.push(`/${locale}/hk/plan/${planId}/route`)}
            >
              경로 보기
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`px-3 py-1 text-[11px] border rounded-2xl ${
                    routeLoadingDay === day
                      ? 'bg-sky-100 border-sky-500 text-sky-700'
                      : 'border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-700'
                  }`}
                  onClick={() => handleShowRouteForDay(day)}
                >
                  {routeLoadingDay === day ? '계산 중...' : `Day ${day} 길찾기`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <KakaoMapScript />
        <KakaoMap
          center={planMapCenter}
          level={7}
          markers={planMapMarkers}
          path={routePath || undefined}
          fitToView
          className="w-full rounded-2xl overflow-hidden"
          style={{ height: 'min(400px, 50vh)' }}
        />

        {selectedItem && (
          <div className="px-4 py-3 mt-3 text-xs bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-900">
              Day {getDayForDate(selectedItem.date)} · {selectedItem.title}
            </div>
            {selectedItem.address && (
              <div className="mt-1 text-[11px] text-slate-600">
                {selectedItem.address}
              </div>
            )}
            <div className="mt-1 text-[11px] text-slate-500">
              {selectedItem.date}{' '}
              {(selectedItem.start_time || selectedItem.end_time) &&
                `· ${selectedItem.start_time || ''} ~ ${selectedItem.end_time || ''}`}
            </div>
            <button
              type="button"
              className="px-3 py-1 mt-2 text-[11px] font-medium text-sky-700 bg-white border border-sky-200 rounded-2xl hover:bg-sky-50"
              onClick={() => router.push(`/${locale}/hk/${selectedItem.place_id}`)}
            >
              장소 상세 보기
            </button>
          </div>
        )}

        {routeSummary && (
          <div className="flex flex-wrap gap-3 px-4 py-2 mt-3 text-[11px] font-medium text-sky-700 bg-sky-50 rounded-2xl">
            <span>총 거리: {(routeSummary.distanceMeters / 1000).toFixed(1)} km</span>
            <span>
              예상 소요 시간: {Math.round(routeSummary.durationSeconds / 60)}분
            </span>
          </div>
        )}

        {kakaoRouteUrl && (
          <div className="mt-3 overflow-hidden border rounded-2xl border-slate-200">
            <iframe
              title="카카오맵 길찾기"
              src={kakaoRouteUrl}
              className="w-full"
              style={{ border: 'none' }}
              height={400}
              allow="fullscreen"
            />
          </div>
        )}
      </div>
    </div>
  );
}
