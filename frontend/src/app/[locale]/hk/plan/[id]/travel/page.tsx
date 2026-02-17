'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../../components/hk/HKLayout';
import { KakaoMapScript, KakaoMap } from '../../../../../../components/hk/map';
import { useToast } from '../../../../../../components/hk/common/Toast';
import apiClient, { type Plan, type PlanItem, type Place } from '../../../../../../lib/api-client';
import { getStringParam } from '../../../../../../utils/typeGuards';
import { getPlaceTitle, getPlaceAddress, getPlaceImage } from '../../../../../../utils/placeUtils';

interface ItineraryItem {
  id: string;
  place_id: string;
  title: string;
  address?: string;
  image?: string;
  date: string;
  start_time: string;
  end_time: string;
  latitude?: number;
  longitude?: number;
}

export default function TravelModePage() {
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [kakaoRouteUrl, setKakaoRouteUrl] = useState<string | null>(null);

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

  const activeItems = useMemo(
    () => itinerary.filter((i) => i.date === activeDate),
    [itinerary, activeDate],
  );

  const selectedItem = useMemo(
    () =>
      itinerary.find((i) => i.id === selectedItemId) ||
      (activeItems.length > 0 ? activeItems[0] : null),
    [itinerary, selectedItemId, activeItems],
  );

  // 계획 로딩
  useEffect(() => {
    const loadPlan = async () => {
      if (!planId) {
        showToast('error', '계획 ID가 올바르지 않습니다.');
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

        const loadPlaceDetails = async () => {
          const itineraryItems: ItineraryItem[] = await Promise.all(
            items.map(async (item, idx) => {
              try {
                const placeDetail: Place = await apiClient.hk.getPlaceDetail(item.place_id);
                return {
                  id: `${item.place_id}-${idx}-${item.date || ''}`,
                  place_id: item.place_id,
                  title: getPlaceTitle(placeDetail),
                  address: getPlaceAddress(placeDetail),
                  image: getPlaceImage(placeDetail),
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
                  title: item.place_id,
                  date: item.date || (plan as any).start_date || '',
                  start_time: item.start_time || '',
                  end_time: item.end_time || '',
                };
              }
            }),
          );
          setItinerary(itineraryItems);
        };

        await loadPlaceDetails();
      } catch (error) {
        console.error('여행 모드용 계획 로딩 중 오류:', error);
        showToast('error', '계획 정보를 불러오는 중 오류가 발생했습니다.');
        router.push(`/${locale}/hk/mytravel`);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId, locale, router, showToast]);

  const handleNavigateFromCurrentLocation = (item: ItineraryItem) => {
    // 좌표가 없으면: 카카오 검색 화면으로라도 안내
    if (!item.latitude || !item.longitude) {
      const searchUrl = `https://map.kakao.com/link/search/${encodeURIComponent(
        item.title || '',
      )}`;
      showToast('info', '이 장소의 좌표를 찾을 수 없어, 카카오 지도 검색 화면으로 열어드릴게요.');
      setSelectedItemId(item.id);
      setKakaoRouteUrl(searchUrl);
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
        setKakaoRouteUrl(url);
      },
      () => {
        showToast('error', '현재 위치를 가져올 수 없습니다. 위치 권한을 허용했는지 확인해주세요.');
      },
    );
  };

  const handleSelectItem = (item: ItineraryItem) => {
    setSelectedItemId(item.id);
    // 리스트에서 일정 클릭 시에도 즉시 길찾기 실행
    handleNavigateFromCurrentLocation(item);
  };

  const mapCenter = useMemo(() => {
    const withCoords = activeItems.filter((i) => i.latitude && i.longitude);
    if (!withCoords.length) {
      return { lat: 37.5665, lng: 126.978 };
    }
    return {
      lat: withCoords[0].latitude as number,
      lng: withCoords[0].longitude as number,
    };
  }, [activeItems]);

  // 초기 진입 시: 현재 Day의 첫 번째 일정으로 자동 길찾기 실행
  useEffect(() => {
    if (!activeItems.length) return;
    if (selectedItemId) return;
    const first = activeItems[0];
    setSelectedItemId(first.id);
    // 현재 위치 → 첫 번째 장소 길찾기 바로 표시
    handleNavigateFromCurrentLocation(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItems, selectedItemId]);

  if (loading) {
    return (
      <HKLayout>
        <div className="travel-mode-container">
          <p>여행 모드를 준비하고 있어요...</p>
        </div>
      </HKLayout>
    );
  }

  return (
    <HKLayout>
      <div className="travel-mode-container">
        <div className="travel-mode-header">
          <button
            type="button"
            className="travel-mode-back"
            onClick={() => router.push(`/${locale}/hk/mytravel`)}
          >
            ← 내 여행으로 돌아가기
          </button>
          <h1 className="travel-mode-title">{planTitle}</h1>
          <p className="travel-mode-dates">
            {startDate} ~ {endDate}
          </p>
        </div>

        <div className="travel-mode-main">
          {/* 왼쪽: 오늘 일정 / 지금 갈 곳 */}
          <div className="travel-mode-left">
            <div className="travel-mode-day-tabs">
              {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`travel-mode-day-tab ${activeDay === day ? 'active' : ''}`}
                  onClick={() => setActiveDay(day)}
                >
                  Day {day}
                </button>
              ))}
            </div>

            <div className="travel-mode-current-card">
              <h2 className="travel-mode-section-title">지금 갈 곳</h2>
              {selectedItem ? (
                <>
                  <div className="travel-mode-current-name">{selectedItem.title}</div>
                  {selectedItem.address && (
                    <div className="travel-mode-current-address">{selectedItem.address}</div>
                  )}
                  <div className="travel-mode-current-time">
                    {selectedItem.date}{' '}
                    {(selectedItem.start_time || selectedItem.end_time) &&
                      `· ${selectedItem.start_time || ''} ~ ${selectedItem.end_time || ''}`}
                  </div>
                  <div className="travel-mode-current-actions">
                    <button
                      type="button"
                      className="travel-mode-primary-button"
                      onClick={() => handleNavigateFromCurrentLocation(selectedItem)}
                    >
                      카카오 길찾기
                    </button>
                    <button
                      type="button"
                      className="travel-mode-secondary-button"
                      onClick={() => {
                        if (!selectedItem.place_id) return;
                        router.push(`/${locale}/hk/${selectedItem.place_id}`);
                      }}
                    >
                      장소 상세 보기
                    </button>
                  </div>
                </>
              ) : (
                <p>이 날에는 아직 일정이 없어요.</p>
              )}
            </div>

            <div className="travel-mode-timeline">
              <h2 className="travel-mode-section-title">오늘 일정</h2>
              {activeItems.length === 0 ? (
                <p>이 날짜에는 일정이 없습니다.</p>
              ) : (
                <div className="travel-mode-timeline-list">
                  {activeItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`travel-mode-timeline-item${
                        selectedItemId === item.id ? ' selected' : ''
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="timeline-time">
                        {item.start_time || item.end_time
                          ? `${item.start_time || ''} ~ ${item.end_time || ''}`
                          : '시간 미정'}
                      </div>
                      <div className="timeline-title">{item.title}</div>
                      {item.address && (
                        <div className="timeline-address">{item.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 길찾기 (지도 + 카카오 길찾기) */}
          <div className="travel-mode-right">
            <div className="travel-mode-map-section">
              <h2 className="travel-mode-section-title">길찾기</h2>
              <KakaoMapScript />
              <KakaoMap
                center={mapCenter}
                level={7}
                markers={activeItems
                  .filter((i) => i.latitude && i.longitude)
                  .map((i, index) => ({
                    lat: i.latitude as number,
                    lng: i.longitude as number,
                    title: `${index + 1}. ${i.title}`,
                    description: i.address
                      ? `${i.address}${
                          i.start_time || i.end_time
                            ? `\n${i.start_time || ''} ~ ${i.end_time || ''}`
                            : ''
                        }`
                      : i.start_time || i.end_time
                      ? `${i.start_time || ''} ~ ${i.end_time || ''}`
                      : '',
                    onClick: () => setSelectedItemId(i.id),
                  }))}
                className="travel-mode-map"
                style={{ height: 'min(420px, 55vh)' }}
              />

              {kakaoRouteUrl && (
                <div className="travel-mode-kakao-iframe-wrapper">
                  <iframe
                    title="카카오맵 길찾기"
                    src={kakaoRouteUrl}
                    className="travel-mode-kakao-iframe"
                    style={{ width: '100%', border: 'none' }}
                    height={360}
                    allow="fullscreen"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .travel-mode-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
            min-height: calc(100vh - 120px);
            width: 100%;
            box-sizing: border-box;
          }

          .travel-mode-header {
            margin-bottom: 24px;
          }

          .travel-mode-back {
            border: none;
            background: transparent;
            color: #3498db;
            cursor: pointer;
            font-size: 0.9rem;
            margin-bottom: 8px;
          }

          .travel-mode-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2c3e50;
            margin: 0;
          }

          .travel-mode-dates {
            margin: 4px 0 0;
            color: #6c757d;
            font-size: 0.95rem;
          }

          .travel-mode-main {
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 24px;
          }

          .travel-mode-left {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .travel-mode-right {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .travel-mode-day-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
          }

          .travel-mode-day-tab {
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid #d0d7de;
            background: #ffffff;
            font-size: 0.9rem;
            cursor: pointer;
          }

          .travel-mode-day-tab.active {
            background: #3498db;
            color: #ffffff;
            border-color: #3498db;
          }

          .travel-mode-section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
          }

          .travel-mode-current-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .travel-mode-current-name {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 4px;
          }

          .travel-mode-current-address {
            font-size: 0.9rem;
            color: #495057;
            margin-bottom: 4px;
          }

          .travel-mode-current-time {
            font-size: 0.85rem;
            color: #6c757d;
            margin-bottom: 12px;
          }

          .travel-mode-current-actions {
            display: flex;
            gap: 8px;
          }

          .travel-mode-primary-button {
            flex: 1;
            border: none;
            border-radius: 999px;
            background: #3498db;
            color: #ffffff;
            padding: 8px 14px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
          }

          .travel-mode-secondary-button {
            border-radius: 999px;
            border: 1px solid #d0d7de;
            background: #ffffff;
            color: #2c3e50;
            padding: 8px 14px;
            font-size: 0.85rem;
            cursor: pointer;
            white-space: nowrap;
          }

          .travel-mode-timeline {
            background: #ffffff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .travel-mode-timeline-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 320px;
            overflow-y: auto;
          }

          .travel-mode-timeline-item {
            text-align: left;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            background: #ffffff;
            padding: 10px 12px;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
          }

          .travel-mode-timeline-item.selected {
            border-color: #3498db;
            background: #e7f1ff;
          }

          .timeline-time {
            font-size: 0.85rem;
            color: #6c757d;
            margin-bottom: 2px;
          }

          .timeline-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .timeline-address {
            font-size: 0.85rem;
            color: #6c757d;
          }

          .travel-mode-map-section {
            background: #ffffff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .travel-mode-map {
            border-radius: 12px;
            overflow: hidden;
          }

          .travel-mode-kakao-iframe-wrapper {
            margin-top: 12px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e9ecef;
          }

          .travel-mode-kakao-iframe {
            display: block;
          }

          @media (max-width: 960px) {
            .travel-mode-main {
              grid-template-columns: 1fr;
            }

            .travel-mode-timeline-list {
              max-height: 220px;
            }
          }
        `}</style>
      </div>
    </HKLayout>
  );
}

