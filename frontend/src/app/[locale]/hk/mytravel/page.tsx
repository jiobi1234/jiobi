'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKLayout from '../../../../components/hk/HKLayout';
import { KakaoMapScript, KakaoMap } from '../../../../components/hk/map';
import { getStringParam } from '../../../../utils/typeGuards';
import { useToast } from '../../../../components/hk/common/Toast';
import apiClient, { type Plan } from '../../../../lib/api-client';

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
  const { showToast } = useToast();
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
  const tripsContainerRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
        // 정렬이 바뀌거나 리스트가 다시 로딩될 때, 기본 3개만 보이도록 초기화
        setIsExpanded(false);
        setVisibleCount(Math.min(3, sortedTrips.length));

        setTravelStats({
          // 총 여행지: 여행 카드(계획) 수로 표시
          total_destinations: mappedTrips.length,
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

  const handleDeletePlan = async (tripId: string) => {
    const confirmDelete = window.confirm('이 여행 계획을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 계획을 삭제할 수 있습니다.');
      return;
    }

    try {
      const result = await apiClient.hk.deletePlan(tripId);
      if (result.success) {
        showToast('success', '여행 계획이 삭제되었습니다.');
        setRecentTrips((prevTrips) => {
          const updatedTrips = prevTrips.filter((trip) => trip.id !== tripId);
          setTravelStats({
            // 총 여행지: 여행 카드(계획) 수로 표시
            total_destinations: updatedTrips.length,
            completed_trips: updatedTrips.length,
            shared_trips: 0,
          });
          return updatedTrips;
        });
      } else {
        showToast('error', '계획을 찾을 수 없거나 삭제할 수 없습니다.');
      }
    } catch (error) {
      console.error('계획 삭제 중 오류:', error);
      showToast(
        'error',
        '계획 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-10 sm:py-8">
          {/* 헤더 */}
          <header className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              {t('description')}
            </p>
          </header>

          {/* 통계 카드 */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center px-4 py-4 bg-white border rounded-2xl shadow-sm border-slate-100">
              <div className="mb-1 text-2xl">📍</div>
              <div className="text-sm text-slate-500">{t('totalDestinations')}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {travelStats.total_destinations}
                <span className="ml-1 text-xs text-slate-500">{t('times')}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-4 bg-white border rounded-2xl shadow-sm border-slate-100">
              <div className="mb-1 text-2xl">✈️</div>
              <div className="text-sm text-slate-500">{t('completedTrips')}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {travelStats.completed_trips}
                <span className="ml-1 text-xs text-slate-500">{t('times')}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-4 bg-white border rounded-2xl shadow-sm border-slate-100">
              <div className="mb-1 text-2xl">↗️</div>
              <div className="text-sm text-slate-500">{t('sharedTrips')}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {travelStats.shared_trips}
                <span className="ml-1 text-xs text-slate-500">{t('times')}</span>
              </div>
            </div>
          </section>

          {/* 최근 여행 카드 리스트 */}
          <section className="space-y-4">
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-3">
                <select
                  id="sortSelect"
                className="h-9 px-3 text-sm border rounded-xl border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">{t('sortLatest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="popular">{t('sortPopular')}</option>
                </select>
                <button
                  type="button"
                  className="h-9 px-4 text-xs font-medium border rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => {
                    if (isExpanded) {
                      setIsExpanded(false);
                      setVisibleCount(Math.min(3, recentTrips.length));
                      tripsContainerRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    } else {
                      setIsExpanded(true);
                      setVisibleCount(recentTrips.length);
                    }
                  }}
                  disabled={recentTrips.length <= 3}
                >
                  {isExpanded ? '접기 ▲' : '모두 보기 ▼'}
                </button>
              </div>
            </div>

            <div
              ref={tripsContainerRef}
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              {recentTrips.length > 0 ? (
                recentTrips.slice(0, visibleCount).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col gap-4 p-4 bg-white border rounded-2xl border-slate-100 shadow-sm sm:flex-row"
                  >
                    {trip.image && (
                      <div className="w-full overflow-hidden rounded-xl sm:w-40 flex-shrink-0">
                        <img
                          src={trip.image}
                          alt="여행 이미지"
                          className="object-cover w-full h-32"
                        />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 gap-2">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {trip.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {trip.dates}
                        </div>
                      </div>
                      {trip.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.hashtags.map((tag, idx) => (
                            <span
                              key={idx}
                            className="px-2 py-0.5 text-[11px] rounded-xl bg-slate-100 text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-600">
                        {t('placesCount')}: {trip.places_count}
                        {t('places')}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100"
                          onClick={() => handlePlanAgain(trip.id)}
                        >
                          {t('planAgain')}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium border rounded-xl border-sky-500 text-sky-600 hover:bg-sky-50"
                          onClick={() => router.push(`/${locale}/hk/plan/${trip.id}/route`)}
                        >
                          경로 보기
                        </button>
                        <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-medium border rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                          onClick={() => handleDeletePlan(trip.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-slate-500 bg-slate-50 rounded-2xl">
                  {t('noTrips')}
                </div>
              )}
            </div>
          </section>

          {/* 발자국 지도 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {t('myFootprints')}
            </h2>
            <div className="overflow-hidden bg-white border rounded-2xl border-slate-100 shadow-sm">
              <KakaoMapScript />
              <KakaoMap
                center={{ lat: 37.5665, lng: 126.978 }}
                level={3}
                markers={visitedPlaces.map((p) => ({
                  lat: p.lat,
                  lng: p.lng,
                  title: p.name,
                  description: p.description,
                }))}
                className="w-full"
                style={{ height: '420px' }}
              />
            </div>
          </section>
      </div>

      {/* 수정 방법 선택 모달 */}
      {showEditModeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowEditModeModal(false)}
        >
          <div
            className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              수정 방법을 선택하세요
            </h2>
            <div className="grid gap-3 mb-4 sm:grid-cols-2">
              <button
                type="button"
                className="flex flex-col items-start w-full px-4 py-3 text-left border rounded-xl border-slate-200 hover:border-sky-500 hover:bg-sky-50/40"
                onClick={handleEditWithAI}
              >
                <div className="text-xl mb-1">🤖</div>
                <div className="text-sm font-semibold text-slate-900">AI로 수정하기</div>
                <div className="mt-1 text-xs text-slate-600">
                  AI와 대화하며 계획을 수정합니다
                </div>
              </button>
              <button
                type="button"
                className="flex flex-col items-start w-full px-4 py-3 text-left border rounded-xl border-slate-200 hover:border-sky-500 hover:bg-sky-50/40"
                onClick={handleEditManually}
              >
                <div className="text-xl mb-1">✏️</div>
                <div className="text-sm font-semibold text-slate-900">직접 수정하기</div>
                <div className="mt-1 text-xs text-slate-600">
                  직접 장소를 추가하고 수정합니다
                </div>
              </button>
            </div>
            <button
              type="button"
              className="w-full py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
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

