'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import { KakaoMapScript, KakaoMap } from '../../../../components/hk/map';
import { getStringParam } from '../../../../utils/typeGuards';
import apiClient, { type Plan } from '../../../../lib/api-client';
import '../../../../styles/hk/mytravel.css';

interface Trip {
  id: string;
  title: string;
  dates: string;
  image?: string;
  hashtags: string[];
  places_count: number;
}

interface VisitedPlace {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

/**
 * 내 여행 페이지 컨텐츠
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
function MyTravelPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.myTravel');
  const [sortBy, setSortBy] = useState('latest');
  const [travelStats, setTravelStats] = useState({
    total_destinations: 0,
    completed_trips: 0,
    shared_trips: 0
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [showEditModeModal, setShowEditModeModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // 백엔드에서 실제 여행 계획 목록 로딩
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiClient.hk.getUserPlans();
        const plans: Plan[] = res.plans || [];

        const mappedTrips: Trip[] = plans.map((plan) => {
          const start = (plan as any).start_date as string | undefined;
          const end = (plan as any).end_date as string | undefined;

          const formatDate = (d?: string) =>
            d ? d.replace(/-/g, '.').trim() : '';

          const dates =
            start && end
              ? `${formatDate(start)} ~ ${formatDate(end)}`
              : start
              ? formatDate(start)
              : '';

          const items = (plan.items || []) as any[];

          return {
            id: (plan as any)._id || plan.id,
            title: plan.title || '제목 없는 계획',
            dates,
            image: undefined,
            hashtags: [],
            places_count: items.length,
          };
        });

        // 정렬 옵션(최신순/오래된순 등)에 따라 정렬 (현재는 최신순 기준: created_at이 있다고 가정)
        const sortedTrips = [...mappedTrips].sort((a, b) => {
          if (sortBy === 'oldest') {
            return a.id.localeCompare(b.id);
          }
          // latest 또는 popular(임시)에서는 id 역순
          return b.id.localeCompare(a.id);
        });

        setRecentTrips(sortedTrips);

        // 간단한 통계: 전체 방문 장소 수 = 모든 계획의 장소 개수 합
        const totalPlaces = mappedTrips.reduce(
          (sum, trip) => sum + trip.places_count,
          0
        );

        setTravelStats({
          total_destinations: totalPlaces,
          completed_trips: mappedTrips.length,
          shared_trips: 0,
        });

        // 지도용 방문 장소는 추후 확장 (현재는 비워둠)
        setVisitedPlaces([]);
      } catch (error: any) {
        console.error('여행 계획 목록 로딩 중 오류:', error);

        // 인증이 필요한데 로그인하지 않은 경우: 로그인 페이지로 이동
        const status = error?.response?.status || error?.status;
        if (status === 401) {
          router.push(`/${locale}/hk/login`);
          return;
        }

        setRecentTrips([]);
        setTravelStats({
          total_destinations: 0,
          completed_trips: 0,
          shared_trips: 0,
        });
        setVisitedPlaces([]);
      }
    };

    loadPlans();
  }, [sortBy]);

  const handlePlanAgain = (tripId: string) => {
    setSelectedTripId(tripId);
    setShowEditModeModal(true);
  };

  const handleEditWithAI = () => {
    if (!selectedTripId) return;
    const queryString = new URLSearchParams({
      editMode: 'true',
      planId: selectedTripId,
    }).toString();
    setShowEditModeModal(false);
    router.push(`/${locale}/hk/plan/ai?${queryString}`);
  };

  const handleEditManually = () => {
    if (!selectedTripId) return;
    setShowEditModeModal(false);
    router.push(`/${locale}/hk/plan/${selectedTripId}`);
  };

  return (
    <>
      <div className="hk-mytravel-container">
        <div className="hk-mytravel-header">
          <h1 className="hk-mytravel-header-title">{t('title')}</h1>
          <p className="hk-mytravel-header-description">{t('description')}</p>
        </div>

        <div className="hk-mytravel-stats-section">
          <div className="hk-mytravel-stat-card">
            <div className="hk-mytravel-stat-icon">📍</div>
            <div className="hk-mytravel-stat-label">{t('totalDestinations')}</div>
            <div className="hk-mytravel-stat-value">{travelStats.total_destinations}{t('times')}</div>
          </div>
          <div className="hk-mytravel-stat-card">
            <div className="hk-mytravel-stat-icon">✈️</div>
            <div className="hk-mytravel-stat-label">{t('completedTrips')}</div>
            <div className="hk-mytravel-stat-value">{travelStats.completed_trips}{t('times')}</div>
          </div>
          <div className="hk-mytravel-stat-card">
            <div className="hk-mytravel-stat-icon">↗️</div>
            <div className="hk-mytravel-stat-label">{t('sharedTrips')}</div>
            <div className="hk-mytravel-stat-value">{travelStats.shared_trips}{t('times')}</div>
          </div>
        </div>

        <div className="hk-mytravel-recent-section">
          <div className="hk-mytravel-trips-header">
            <div className="hk-mytravel-sort-dropdown">
              <select 
                id="sortSelect"
                className="hk-mytravel-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">{t('sortLatest')}</option>
                <option value="oldest">{t('sortOldest')}</option>
                <option value="popular">{t('sortPopular')}</option>
              </select>
            </div>
          </div>

          <div className="hk-mytravel-trips-container">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <div key={trip.id} className="hk-mytravel-trip-card">
                  <div className="hk-mytravel-trip-image">
                    {trip.image ? (
                      <img src={trip.image} alt="여행 이미지" />
                    ) : null}
                  </div>
                  <div className="hk-mytravel-trip-content">
                    <div className="hk-mytravel-trip-title">{trip.title}</div>
                    <div className="hk-mytravel-trip-dates">{trip.dates}</div>
                    <div className="hk-mytravel-trip-hashtags">
                      {trip.hashtags.map((tag, idx) => (
                        <span key={idx} className="hk-mytravel-hashtag">{tag}</span>
                      ))}
                    </div>
                    <div className="hk-mytravel-trip-stats">
                      <span className="hk-mytravel-places-count">
                        {t('placesCount')}: {trip.places_count}{t('places')}
                      </span>
                    </div>
                    <div className="hk-mytravel-trip-actions">
                      <button 
                        className="hk-mytravel-plan-again-button" 
                        onClick={() => handlePlanAgain(trip.id)}
                      >
                        {t('planAgain')}
                      </button>
                      <button
                        type="button"
                        className="hk-mytravel-route-view-button"
                        onClick={() => router.push(`/${locale}/hk/plan/${trip.id}/route`)}
                      >
                        경로 보기
                      </button>
                      <button
                        type="button"
                        className="hk-mytravel-travel-mode-button"
                        onClick={() => router.push(`/${locale}/hk/plan/${trip.id}/travel`)}
                      >
                        이 계획으로 여행하기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="hk-mytravel-no-trips">{t('noTrips')}</div>
            )}
          </div>
        </div>

        <div className="hk-mytravel-footprints-section">
          <div className="hk-mytravel-footprints-title">{t('myFootprints')}</div>
          <div className="hk-mytravel-map-container">
            <KakaoMapScript />
            <KakaoMap
              center={{ lat: 37.5665, lng: 126.9780 }}
              level={3}
              markers={visitedPlaces.map((p) => ({
                lat: p.lat,
                lng: p.lng,
                title: p.name,
                description: p.description,
              }))}
              className="hk-mytravel-map"
              style={{ height: '500px' }}
            />
          </div>
        </div>
      </div>

      {/* 수정 방법 선택 모달 */}
      {showEditModeModal && (
        <div className="hk-mytravel-modal-overlay" onClick={() => setShowEditModeModal(false)}>
          <div className="hk-mytravel-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="hk-mytravel-modal-title">수정 방법을 선택하세요</h2>
            <div className="hk-mytravel-edit-options">
              <button
                type="button"
                className="hk-mytravel-edit-option"
                onClick={handleEditWithAI}
              >
                <div className="hk-mytravel-edit-icon">🤖</div>
                <div className="hk-mytravel-edit-title">AI로 수정하기</div>
                <div className="hk-mytravel-edit-description">AI와 대화하며 계획을 수정합니다</div>
              </button>
              <button
                type="button"
                className="hk-mytravel-edit-option"
                onClick={handleEditManually}
              >
                <div className="hk-mytravel-edit-icon">✏️</div>
                <div className="hk-mytravel-edit-title">직접 수정하기</div>
                <div className="hk-mytravel-edit-description">직접 장소를 추가하고 수정합니다</div>
              </button>
            </div>
            <button
              type="button"
              className="hk-mytravel-modal-close"
              onClick={() => setShowEditModeModal(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 내 여행 페이지 (Wrapper)
 * HKLayout을 제공하여 ToastProvider 사용 가능하도록 함
 */
export default function MyTravelPage() {
  return (
    <HKLayout>
      <MyTravelPageContent />
    </HKLayout>
  );
}

