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
import '../../../../styles/hk/place-detail.css';

/**
 * 장소 상세 페이지 컨텐츠 컴포넌트
 * (HKProvider 내부에서 렌더링되므로 useHKContext 사용 가능)
 */
export default function PlaceDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const placeId = getStringParam(params, 'id');
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
  }, [placeId, getPlaceFromCache]);

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
      <div className="hk-place-container">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="hk-place-container">
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="hk-place-container">
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
      <div className="hk-place-container">
          <HKBackButton variant="ghost" size="md">
            ← 돌아가기
          </HKBackButton>

          <div className="hk-place-detail">
            {/* 이미지 섹션 - Google Photos 우선, 없으면 기존 이미지/아이콘 */}
            <div className="hk-place-image">
              {googlePhotos && googlePhotos.length > 0 ? (
                <img
                  src={googlePhotos[0].url}
                  alt={title}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : image ? (
                <img
                  src={image}
                  alt={title}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <div className="hk-place-image-placeholder">
                  <div className="hk-place-image-icon">{getCategoryIcon(category)}</div>
                  <div className="hk-place-image-text">이미지 없음</div>
                </div>
              )}
            </div>

            <div className="hk-place-info">
              <h1 className="hk-place-title">{title}</h1>
              
              <div className="hk-place-info-section">
                {/* 유형 태그 (Google types) */}
                {googleTypes && googleTypes.length > 0 && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🏷️</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">유형</span>
                      <div className="hk-place-types">
                        {googleTypes.map((t, idx) => (
                          <span key={idx} className="hk-place-type-chip">
                            {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 주소 정보 */}
                {(addr1 || address) && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-address-icon">📍</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">주소</span>
                      <div className="hk-place-address-details">
                        {addr1 ? (
                          <>
                            <span className="hk-place-address-main">{addr1}</span>
                            {addr2 && <span className="hk-place-address-sub">{addr2}</span>}
                          </>
                        ) : (
                          <span className="hk-place-address-main">{address}</span>
                        )}
                        {zipcode && <span className="hk-place-address-sub">({zipcode})</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* 전화번호 */}
                {tel && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">📞</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">전화번호</span>
                      <span className="hk-place-info-value">{tel}</span>
                    </div>
                  </div>
                )}

                {/* 문의처 */}
                {infocenter && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">ℹ️</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">문의처</span>
                      <span className="hk-place-info-value">{infocenter}</span>
                    </div>
                  </div>
                )}

                {/* 영업시간 (Google 기준) */}
                {googleOpeningHours?.weekday_text && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🕒</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">영업시간 (Google 기준)</span>
                      <div className="hk-place-opening-hours">
                        {googleOpeningHours.weekday_text.map((line: string, idx: number) => (
                          <div key={idx} className="hk-place-opening-line">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 이용시간 (공공데이터) */}
                {usetime && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🕐</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">이용시간</span>
                      <span className="hk-place-info-value">{usetime}</span>
                    </div>
                  </div>
                )}

                {/* 휴무일 */}
                {restdate && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🚫</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">휴무일</span>
                      <span className="hk-place-info-value">{restdate}</span>
                    </div>
                  </div>
                )}

                {/* 주차 정보 */}
                {parking && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🅿️</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">주차</span>
                      <span className="hk-place-info-value">{parking}</span>
                    </div>
                  </div>
                )}

                {/* 카카오 지도 링크 */}
                {kakaoUrl && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🗺️</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">카카오 지도</span>
                      <a
                        href={kakaoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hk-place-info-link"
                      >
                        카카오 지도에서 자세히 보기
                      </a>
                    </div>
                  </div>
                )}

                {/* 홈페이지 */}
                {homepage && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🌐</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">홈페이지</span>
                      <a 
                        href={homepage} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hk-place-info-link"
                      >
                        {(() => {
                          try {
                            return homepage.startsWith('http') ? new URL(homepage).hostname : homepage;
                          } catch {
                            return homepage;
                          }
                        })()}
                      </a>
                    </div>
                  </div>
                )}

                {/* 대표 메뉴 (음식점) */}
                {firstmenu && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🍽️</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">대표 메뉴</span>
                      <span className="hk-place-info-value">{firstmenu}</span>
                    </div>
                  </div>
                )}

                {/* 취급 메뉴 (음식점) */}
                {treatmenu && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">📋</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">취급 메뉴</span>
                      <span className="hk-place-info-value">{treatmenu}</span>
                    </div>
                  </div>
                )}

                {/* 체크인 시간 (숙박) */}
                {checkintime && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🔑</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">체크인</span>
                      <span className="hk-place-info-value">{checkintime}</span>
                    </div>
                  </div>
                )}

                {/* 체크아웃 시간 (숙박) */}
                {checkouttime && (
                  <div className="hk-place-info-item">
                    <span className="hk-place-info-icon">🚪</span>
                    <div className="hk-place-info-content">
                      <span className="hk-place-info-label">체크아웃</span>
                      <span className="hk-place-info-value">{checkouttime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 장소 개요 - 있으면 표시 */}
              {description && (
                <div className="hk-place-description">
                  <h2>장소 개요</h2>
                  <p>{description}</p>
                </div>
              )}

              {/* Google 리뷰 (있을 경우) */}
              {googleReviews && googleReviews.length > 0 && (
                <div className="hk-place-description hk-place-google-reviews">
                  <h2>Google 리뷰</h2>
                  {typeof googleRating === 'number' && typeof googleRatingsTotal === 'number' && (
                    <div className="hk-place-rating-inline">
                      Google 평점 {googleRating.toFixed(1)}점 · 리뷰 {googleRatingsTotal}개 기준
                    </div>
                  )}
                  <div className="hk-place-reviews-list">
                    {googleReviews.slice(0, 5).map((rev, idx) => (
                      <div key={idx} className="hk-place-review-card">
                        <div className="hk-place-review-header">
                          <span className="hk-place-review-author">
                            {rev.author_name || '익명 사용자'}
                          </span>
                          {typeof rev.rating === 'number' && (
                            <span className="hk-place-review-rating">
                              ⭐ {rev.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {rev.relative_time_description && (
                          <div className="hk-place-review-time">
                            {rev.relative_time_description}
                          </div>
                        )}
                        {rev.text && (
                          <div className="hk-place-review-text">
                            {rev.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {place.google_place_id && (
                    <div className="hk-place-review-more">
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
                          place.google_place_id
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hk-place-review-more-link"
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
