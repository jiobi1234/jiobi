'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
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
      <div className="plan-create-container">
        <p>계획 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <>
      <div className="plan-create-container">
        <div className="plan-header">
          <HKBackButton />
          <h1 className="header-title">여행 계획 편집하기</h1>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="title-input"
            placeholder="여행 계획의 제목을 입력하세요"
            id="planTitle"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
          />
          <div className="date-inputs">
            <input
              type="date"
              className="date-input"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>-</span>
            <input
              type="date"
              className="date-input"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="save-button" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>

        <div className="plan-main-content">
          {/* 왼쪽: 장소 추가 (위시리스트 / 검색) */}
          <div className="search-panel">
            {/* 탭 버튼 */}
            <div className="search-mode-tabs">
              <button
                className={`search-mode-tab ${searchMode === 'search' ? 'active' : ''}`}
                onClick={() => setSearchMode('search')}
                type="button"
              >
                검색으로 추가
              </button>
              <button
                className={`search-mode-tab ${searchMode === 'wishlist' ? 'active' : ''}`}
                onClick={() => setSearchMode('wishlist')}
                type="button"
              >
                위시리스트로 추가
              </button>
            </div>

            {/* 검색 모드 */}
            {searchMode === 'search' && (
              <>
                <div className="search-bar-wrapper">
                  <HKSearchBar
                    initialKeyword=""
                    onSearch={handleSearchPlaces}
                    debounceMs={400}
                  />
                </div>

                {loadingSearch ? (
                  <p>장소를 검색하는 중입니다...</p>
                ) : searchResults.length === 0 ? (
                  <p>검색 결과가 없습니다. 검색어 또는 지역을 바꿔보세요.</p>
                ) : (
                  <div className="search-results">
                    {searchResults.map((place) => {
                      const placeId = getPlaceId(place);
                      const image = getPlaceImage(place);
                      const title = (place.title as string) ||
                        (place.place_name as string) ||
                        '장소';
                      const address = (place.address as string) ||
                        (place.address_name as string) ||
                        place.addr1 ||
                        '';

                      return (
                        <div
                          key={placeId}
                          className="search-result-item"
                          onClick={() => {
                            if (placeId) {
                              router.push(`/${locale}/hk/${placeId}`);
                            }
                          }}
                        >
                          <div className="result-image">
                            {image ? (
                              <img src={image} alt={title} />
                            ) : (
                              <div className="result-image-placeholder">📍</div>
                            )}
                          </div>
                          <div className="result-info">
                            <div className="result-name">{title}</div>
                            <div className="result-details">{address}</div>
                          </div>
                          <button
                            className="add-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFromSearchResult(place);
                            }}
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 위시리스트 모드 */}
            {searchMode === 'wishlist' && (
              <>
                {loadingWishlist ? (
                  <p>위시리스트를 불러오는 중입니다...</p>
                ) : wishlist.length === 0 ? (
                  <p>위시리스트에 저장된 장소가 없습니다.</p>
                ) : (
                  <div className="search-results">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="search-result-item"
                        onClick={() => {
                          if (item.place_id) {
                            router.push(`/${locale}/hk/${item.place_id}`);
                          }
                        }}
                      >
                        <div className="result-image">
                          {item.image ? (
                            <img src={item.image} alt={item.title} />
                          ) : (
                            <div className="result-image-placeholder">📍</div>
                          )}
                        </div>
                        <div className="result-info">
                          <div className="result-name">{item.title}</div>
                          <div className="result-details">{item.address || ''}</div>
                        </div>
                        <button
                          className="add-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFromWishlist(item);
                          }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 오른쪽: 일정 편집 */}
          <div className="plan-panel">
            <div className="day-tabs">
              {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                <button
                  key={day}
                  className={`day-tab ${activeDay === day ? 'active' : ''}`}
                  onClick={() => setActiveDay(day)}
                >
                  Day {day}
                </button>
              ))}
            </div>

            <div className="itinerary-list">
              {itinerary
                .filter((i) => i.date === activeDate)
                .map((item) => (
                  <div
                    key={item.id}
                    className="itinerary-item"
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
                        // 같은 날짜 내에서만 순서 변경
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
                    <span className="drag-handle">⋮⋮</span>
                    <div className="itinerary-info">
                      <div className="itinerary-name">{item.title}</div>
                      <div className="itinerary-time-inputs">
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateItemTime(item.id, 'start_time', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span> - </span>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateItemTime(item.id, 'end_time', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="itinerary-detail-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${locale}/hk/${item.place_id}`);
                          }}
                        >
                          상세보기
                        </button>
                      </div>
                    </div>
                    <div className="itinerary-actions">
                      <button
                        className="info-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              {itinerary.filter((i) => i.date === activeDate).length === 0 && (
                <p>이 날짜에는 추가된 일정이 없습니다. 위시리스트에서 장소를 추가해보세요.</p>
              )}
            </div>
          </div>
        </div>

        {/* 지도 섹션: 전체 Day 마커 + Day별 길찾기 (자동 계획과 동일) */}
        <div className="plan-map-section">
          <div className="plan-map-header">
            <h2 className="plan-map-title">지도에서 보기</h2>
            <button
              type="button"
              className="plan-route-view-button"
              onClick={() => router.push(`/${locale}/hk/plan/${planId}/route`)}
            >
              경로 보기
            </button>
            <div className="plan-route-day-buttons">
              {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`plan-route-day-button${routeLoadingDay === day ? ' loading' : ''}`}
                  onClick={() => handleShowRouteForDay(day)}
                >
                  {routeLoadingDay === day ? '계산 중...' : `Day ${day} 길찾기`}
                </button>
              ))}
            </div>
          </div>
          <KakaoMapScript />
          <KakaoMap
            center={planMapCenter}
            level={7}
            markers={planMapMarkers}
            path={routePath || undefined}
            fitToView
            className="plan-map"
            style={{ height: 'min(400px, 50vh)' }}
          />
          {selectedItem && (
            <div className="plan-map-selected">
              <div className="plan-map-selected-title">
                Day {getDayForDate(selectedItem.date)} · {selectedItem.title}
              </div>
              {selectedItem.address && (
                <div className="plan-map-selected-address">{selectedItem.address}</div>
              )}
              <div className="plan-map-selected-time">
                {selectedItem.date}{' '}
                {(selectedItem.start_time || selectedItem.end_time) &&
                  `· ${selectedItem.start_time || ''} ~ ${selectedItem.end_time || ''}`}
              </div>
              <button
                type="button"
                className="plan-map-selected-link"
                onClick={() => router.push(`/${locale}/hk/${selectedItem.place_id}`)}
              >
                장소 상세 보기
              </button>
            </div>
          )}
          {routeSummary && (
            <div className="plan-route-summary">
              <span>
                총 거리: {(routeSummary.distanceMeters / 1000).toFixed(1)} km
              </span>
              <span>
                예상 소요 시간: {Math.round(routeSummary.durationSeconds / 60)}분
              </span>
            </div>
          )}
          {kakaoRouteUrl && (
            <div className="plan-kakao-iframe-wrapper">
              <iframe
                title="카카오맵 길찾기"
                src={kakaoRouteUrl}
                className="plan-kakao-iframe"
                style={{ width: '100%', border: 'none' }}
                height={400}
                allow="fullscreen"
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .plan-create-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: calc(100vh - 120px);
          width: 100%;
          box-sizing: border-box;
        }

        .plan-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          padding: 20px 0;
          width: 100%;
          position: relative;
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          text-align: center;
          margin: 0;
        }

        .input-section {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          width: 100%;
          box-sizing: border-box;
          flex-wrap: wrap;
        }

        .title-input {
          flex: 0 0 600px;
          padding: 15px 20px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .title-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .date-input {
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .save-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: auto;
        }

        .save-button:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .save-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .delete-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .delete-button:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .plan-main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          height: 800px;
          max-height: 800px;
        }

        .search-panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 800px;
          overflow: hidden;
        }

        .search-mode-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .search-mode-tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #6c757d;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: -2px;
        }

        .search-mode-tab:hover {
          color: #3498db;
        }

        .search-mode-tab.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .search-bar-wrapper {
          margin-bottom: 20px;
        }

        .search-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
          padding-right: 10px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          margin-bottom: 10px;
          background: white;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .search-result-item:hover {
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
        }

        .result-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: #e9ecef;
          margin-right: 15px;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .result-image-placeholder {
          font-size: 24px;
          color: #adb5bd;
        }

        .result-info {
          flex: 1;
        }

        .result-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .result-details {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .add-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: #3498db;
          transform: scale(1.1);
        }

        .plan-panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 800px;
          overflow: hidden;
        }

        .day-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .day-tab {
          padding: 10px 20px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          background: white;
          color: #6c757d;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .day-tab.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .day-tab:hover {
          border-color: #3498db;
          color: #3498db;
        }

        .itinerary-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 10px;
          max-height: 550px;
          min-height: 300px;
        }

        .itinerary-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          margin-bottom: 10px;
          background: white;
          transition: all 0.3s ease;
        }

        .itinerary-item[draggable="true"]:hover {
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
        }

        .drag-handle {
          color: #6c757d;
          font-size: 1.2rem;
          margin-right: 15px;
          cursor: grab;
        }

        .itinerary-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: #e9ecef;
          margin-right: 15px;
        }

        .itinerary-info {
          flex: 1;
        }

        .itinerary-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .itinerary-time-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .itinerary-time-inputs input[type="time"] {
          padding: 6px 10px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
          background: #f8f9fa;
        }

        .itinerary-detail-btn {
          margin-left: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #d0d7de;
          background: #ffffff;
          font-size: 0.8rem;
          color: #2c3e50;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s;
        }

        .itinerary-detail-btn:hover {
          background: #f3f4f6;
          border-color: #1890ff;
        }

        .itinerary-time-inputs input[type="time"]:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .itinerary-actions {
          display: flex;
          gap: 10px;
        }

        .itinerary-item {
          cursor: move;
        }

        .info-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .info-btn:hover {
          background: #3498db;
        }

        .plan-map-section {
          margin-top: 30px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .plan-map-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .plan-map-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0;
        }

        .plan-route-view-button {
          padding: 8px 16px;
          border-radius: 20px;
          border: 2px solid #1890ff;
          background: #fff;
          color: #1890ff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .plan-route-view-button:hover {
          background: #1890ff;
          color: #fff;
        }

        .plan-route-day-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .plan-route-day-button {
          border: 1px solid #d0d7de;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.85rem;
          background: #ffffff;
          color: #2c3e50;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.1s;
        }

        .plan-route-day-button:hover {
          background: #f3f4f6;
          border-color: #1890ff;
        }

        .plan-route-day-button.loading {
          background: #e6f4ff;
          border-color: #1890ff;
          color: #1890ff;
          cursor: default;
        }

        .plan-route-summary {
          margin-top: 12px;
          font-size: 0.85rem;
          color: #495057;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .plan-kakao-iframe-wrapper {
          margin-top: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

        .plan-kakao-iframe {
          display: block;
        }

        .plan-map {
          border-radius: 12px;
          overflow: hidden;
        }

        .plan-map-selected {
          margin-top: 12px;
          padding: 12px 14px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .plan-map-selected-title {
          font-size: 0.98rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .plan-map-selected-address {
          font-size: 0.86rem;
          color: #495057;
          margin-bottom: 4px;
        }

        .plan-map-selected-time {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 8px;
        }

        .plan-map-selected-link {
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          background: #3498db;
          color: #fff;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .plan-map-selected-link:hover {
          background: #2980b9;
        }

        @media (max-width: 768px) {
          .plan-main-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .input-section {
            flex-direction: column;
            align-items: stretch;
          }

          .date-inputs {
            justify-content: space-between;
          }

          .category-filters {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
