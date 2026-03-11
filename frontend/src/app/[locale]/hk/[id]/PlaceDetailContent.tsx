'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import LoadingState from '../../../../components/hk/LoadingState';
import ErrorState from '../../../../components/hk/ErrorState';
import apiClient from '../../../../lib/api-client';
import type { Place } from '../../../../lib/api-client';
import { useHKContext } from '../../../../contexts/HKContext';
import { useApiError } from '../../../../hooks/common/useApiError';
import { logError } from '../../../../utils/logger';
import HKBackButton from '../../../../components/hk/common/HKBackButton';
import { 
  getPlaceTitle, 
  getPlaceAddress, 
  getPlaceAddr1,
  getPlaceAddr2,
  getPlaceTel,
  getPlaceDescription, 
  getPlaceImage,
  getPlaceHomepage,
  getPlaceZipcode,
  getPlaceUsetime,
  getPlaceRestdate,
  getPlaceParking,
  getPlaceInfocenter,
  getPlaceFirstmenu,
  getPlaceTreatmenu,
  getPlaceCheckintime,
  getPlaceCheckouttime
} from '../../../../utils/placeUtils';
import { getStringParam } from '../../../../utils/typeGuards';

/**
 * 장소 상세 페이지 컨텐츠 컴포넌트
 * (HKProvider 내부에서 렌더링되므로 useHKContext 사용 가능)
 */
export default function PlaceDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  // 정적 export + hk/0 템플릿 환경에서 실제 URL의 id를 한 번 더 파싱해 사용
  const [placeId, setPlaceId] = useState<string | null>(null);
  const { navigationHistory, setNavigationHistory, getPlaceFromCache } = useHKContext();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError } = useApiError();
  
  // Google 관련 데이터는 place가 있을 때만 접근
  const googleRating = place ? (place as any).google_rating as number | undefined : undefined;
  const googleRatingsTotal = place ? (place as any).google_ratings_total as number | undefined : undefined;
  const googleReviews = place ? (place as any).google_reviews as any[] | undefined : undefined;
  const googlePhotos = place ? (place as any).google_photos as { url: string }[] | undefined : undefined;
  const googleOpeningHours = place ? (place as any).google_opening_hours as any | undefined : undefined;
  const googleTypes = place ? (place as any).google_types as string[] | undefined : undefined;

  // 브라우저 URL과 동적 파라미터에서 최종 place_id 결정 (최초 1회)
  useEffect(() => {
    let resolvedId: string | null = getStringParam(params, 'id');

    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) {
        resolvedId = last;
      }
    }

    setPlaceId(resolvedId);
  }, [params]);

  useEffect(() => {
    const loadPlaceDetail = async () => {
      if (!placeId || placeId.trim().length === 0) {
        handleError(new Error('장소 ID가 필요합니다.'));
        setLoading(false);
        return;
      }

      setLoading(true);
      clearError();

      // 1. 먼저 캐시에서 확인 (검색 결과에서 이미 받은 데이터 재사용)
      const cachedPlace = getPlaceFromCache(placeId);
      if (cachedPlace) {
        console.log('캐시에서 장소 정보 사용:', placeId);
        setPlace(cachedPlace);
        setLoading(false);
        return;
      }

      // 2. 캐시에 없으면 API 호출
      try {
        console.log('API에서 장소 정보 조회:', placeId);
        // API 엔드포인트: GET /hk/place/{place_id}
        const data = await apiClient.hk.getPlaceDetail(placeId);
        setPlace(data);
      } catch (err) {
        logError('장소 상세 정보 로딩 오류', err, 'PlaceDetailPage');
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPlaceDetail();
  }, [placeId, getPlaceFromCache, clearError, handleError]);

  const handleBack = () => {
    // 이전 페이지로 돌아갈 때 상태 복원
    if (navigationHistory.category) {
      router.push(`/${locale}/hk`);
    } else {
      router.push(`/${locale}/hk`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl px-4 py-10 mx-auto">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl px-4 py-10 mx-auto">
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-5xl px-4 py-10 mx-auto">
        <ErrorState 
          error="장소 정보를 찾을 수 없습니다." 
          onRetry={handleBack} 
        />
      </div>
    );
  }

  // Google 우선: 제목/주소/전화/웹사이트
  const title = (place as any).google_name || getPlaceTitle(place);
  const address =
    (place as any).google_formatted_address || getPlaceAddress(place);
  const addr1 = getPlaceAddr1(place);
  const addr2 = getPlaceAddr2(place);
  const tel =
    (place as any).google_formatted_phone_number || getPlaceTel(place);
  const description = getPlaceDescription(place);
  const image = getPlaceImage(place);
  const category = place.category || '';
  const kakaoUrl = place.kakao_url;
  const homepage = (place as any).google_website || getPlaceHomepage(place);
  const zipcode = getPlaceZipcode(place);
  const usetime = getPlaceUsetime(place);
  const restdate = getPlaceRestdate(place);
  const parking = getPlaceParking(place);
  const infocenter = getPlaceInfocenter(place);
  const firstmenu = getPlaceFirstmenu(place);
  const treatmenu = getPlaceTreatmenu(place);
  const checkintime = getPlaceCheckintime(place);
  const checkouttime = getPlaceCheckouttime(place);

  // 카테고리 아이콘
  const getCategoryIcon = (cat: string): string => {
    switch (cat) {
      case 'tourist': return '🏛️';
      case 'event': return '🎪';
      case 'accommodation': return '🏨';
      case 'restaurant': return '🍽️';
      default: return '📍';
    }
  };

  return (
    <>
      <div className="max-w-5xl px-4 py-6 mx-auto space-y-6 sm:py-8">
        <HKBackButton variant="ghost" size="md">
          ← 돌아가기
        </HKBackButton>

        <div className="overflow-hidden bg-white border rounded-2xl border-slate-100 shadow-sm">
          {/* 이미지 섹션 */}
          <div className="w-full h-56 overflow-hidden bg-slate-100 sm:h-72">
            {googlePhotos && googlePhotos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={googlePhotos[0].url}
                alt={title}
                className="object-cover w-full h-full"
              />
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-slate-400">
                <div className="text-4xl">{getCategoryIcon(category)}</div>
                <div className="text-xs">이미지 없음</div>
              </div>
            )}
          </div>

          {/* 본문 정보 */}
          <div className="px-4 py-5 space-y-5 sm:px-6">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {title}
            </h1>

            <div className="space-y-4 text-sm">
              {/* 유형 태그 */}
              {googleTypes && googleTypes.length > 0 && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🏷️</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      유형
                    </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                      {googleTypes.map((t, idx) => (
                        <span
                          key={idx}
                            className="px-2 py-0.5 text-[11px] rounded-xl bg-slate-100 text-slate-700"
                        >
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 주소 */}
              {(addr1 || address) && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">📍</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      주소
                    </div>
                    <div className="mt-1 text-sm text-slate-800 space-y-0.5">
                      {addr1 ? (
                        <>
                          <div>{addr1}</div>
                          {addr2 && (
                            <div className="text-xs text-slate-500">{addr2}</div>
                          )}
                        </>
                      ) : (
                        <div>{address}</div>
                      )}
                      {zipcode && (
                        <div className="text-xs text-slate-500">({zipcode})</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 전화번호 */}
              {tel && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">📞</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      전화번호
                    </div>
                    <div className="mt-1 text-sm text-slate-800">{tel}</div>
                  </div>
                </div>
              )}

              {/* 문의처 */}
              {infocenter && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">ℹ️</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      문의처
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      {infocenter}
                    </div>
                  </div>
                </div>
              )}

              {/* 영업시간 (Google) */}
              {googleOpeningHours?.weekday_text && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🕒</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      영업시간 (Google 기준)
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-700">
                      {googleOpeningHours.weekday_text.map(
                        (line: string, idx: number) => (
                          <div key={idx}>{line}</div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 이용시간 */}
              {usetime && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🕐</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      이용시간
                    </div>
                    <div className="mt-1 text-sm text-slate-800">{usetime}</div>
                  </div>
                </div>
              )}

              {/* 휴무일 */}
              {restdate && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🚫</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      휴무일
                    </div>
                    <div className="mt-1 text-sm text-slate-800">{restdate}</div>
                  </div>
                </div>
              )}

              {/* 주차 */}
              {parking && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🅿️</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      주차
                    </div>
                    <div className="mt-1 text-sm text-slate-800">{parking}</div>
                  </div>
                </div>
              )}

              {/* 카카오 지도 */}
              {kakaoUrl && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🗺️</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      카카오 지도
                    </div>
                    <a
                      href={kakaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                    >
                      카카오 지도에서 자세히 보기
                    </a>
                  </div>
                </div>
              )}

              {/* 홈페이지 */}
              {homepage && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🌐</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      홈페이지
                    </div>
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                    >
                      {(() => {
                        try {
                          return homepage.startsWith('http')
                            ? new URL(homepage).hostname
                            : homepage;
                        } catch {
                          return homepage;
                        }
                      })()}
                    </a>
                  </div>
                </div>
              )}

              {/* 대표 메뉴 */}
              {firstmenu && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🍽️</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      대표 메뉴
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      {firstmenu}
                    </div>
                  </div>
                </div>
              )}

              {/* 취급 메뉴 */}
              {treatmenu && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">📋</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      취급 메뉴
                    </div>
                    <div className="mt-1 text-sm whitespace-pre-line text-slate-800">
                      {treatmenu}
                    </div>
                  </div>
                </div>
              )}

              {/* 체크인 / 체크아웃 */}
              {checkintime && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🔑</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      체크인
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      {checkintime}
                    </div>
                  </div>
                </div>
              )}
              {checkouttime && (
                <div className="flex gap-3">
                  <span className="mt-0.5 text-lg">🚪</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-500">
                      체크아웃
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      {checkouttime}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 장소 개요 */}
            {description && (
              <div className="pt-4 mt-2 border-t border-slate-100">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  장소 개요
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {/* Google 리뷰 */}
            {googleReviews && googleReviews.length > 0 && (
              <div className="pt-4 mt-2 border-t border-slate-100">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  Google 리뷰
                </h2>
                {typeof googleRating === 'number' &&
                  typeof googleRatingsTotal === 'number' && (
                    <div className="mb-2 text-xs text-slate-600">
                      Google 평점 {googleRating.toFixed(1)}점 · 리뷰{' '}
                      {googleRatingsTotal}개 기준
                    </div>
                  )}
                <div className="space-y-2">
                  {googleReviews.slice(0, 5).map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-xl border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {rev.author_name || '익명 사용자'}
                        </span>
                        {typeof rev.rating === 'number' && (
                          <span className="text-xs text-amber-500">
                            ⭐ {rev.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {rev.relative_time_description && (
                        <div className="mb-1 text-[11px] text-slate-500">
                          {rev.relative_time_description}
                        </div>
                      )}
                      {rev.text && (
                        <div className="text-xs leading-relaxed text-slate-700">
                          {rev.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {place.google_place_id && (
                  <div className="mt-2">
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
                        place.google_place_id
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-xs font-medium text-sky-600 hover:text-sky-700"
                    >
                      Google에서 전체 리뷰 보기
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
