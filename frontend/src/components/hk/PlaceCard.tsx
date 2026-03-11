'use client';

import { memo, useCallback, useState, MouseEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import type { Place } from '../../lib/api-client';
import apiClient from '../../lib/api-client';
import { useHKContext } from '../../contexts/HKContext';
import { getPlaceId, getPlaceTitle, getPlaceAddress, getPlaceImage } from '../../utils/placeUtils';
import { getStringParam } from '../../utils/typeGuards';
import { useToast } from './common/Toast';

interface PlaceCardProps {
  place: Place;
  category: string;
  onClick?: (place: Place) => void;
  /** true면 그리드 등에서 셀 전체 너비 사용 (기본: 고정 너비 카드) */
  fillWidth?: boolean;
}

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'tourist': return '🏛️';
    case 'event': return '🎪';
    case 'accommodation': return '🏨';
    case 'restaurant': return '🍽️';
    default: return '📍';
  }
};

function PlaceCard({ place, category, onClick, fillWidth }: PlaceCardProps) {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const { setNavigationHistory } = useHKContext();
  const { showToast } = useToast();
  
  const googleName = (place as any).google_name as string | undefined;
  const googleFormattedAddress = (place as any).google_formatted_address as string | undefined;
  const googleRating = (place as any).googleRating as number | undefined;
  const googleRatingsTotal = (place as any).googleRatingsTotal as number | undefined;
  const imageUrl = (place as any).imageUrl as string | undefined;

  const title = googleName || getPlaceTitle(place);
  const address = googleFormattedAddress || getPlaceAddress(place);
  const image = imageUrl || getPlaceImage(place);
  const icon = getCategoryIcon(category);
  const placeId = getPlaceId(place);

  const [liked, setLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Context에서 초기 위시리스트 상태 반영
  const { isPlaceLiked, setWishlist } = useHKContext();

  useEffect(() => {
    if (placeId) {
      setLiked(isPlaceLiked(placeId));
    }
  }, [placeId, isPlaceLiked]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(place);
    } else {
      // 기본 동작: 상세 페이지로 이동
      if (placeId) {
        // 네비게이션 히스토리 저장
        setNavigationHistory({
          category: category || undefined,
        });
        router.push(`/${locale}/hk/${placeId}`);
      }
    }
  }, [place, placeId, category, onClick, router, locale, setNavigationHistory]);

  const handleWishlistClick = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!placeId) {
      return;
    }

    // 로그인한 사용자만 위시리스트 사용 가능
    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 위시리스트를 사용할 수 있습니다.');
      return;
    }

    if (wishlistLoading) {
      return;
    }

    setWishlistLoading(true);
    try {
      if (!liked) {
        const saved = await apiClient.hk.addToWishlist(place);
        setWishlist((prev) => ({ ...prev, [saved.place_id]: saved }));
        setLiked(true);
      } else {
        const result = await apiClient.hk.removeFromWishlist(placeId);
        if (result.success) {
          setWishlist((prev) => {
            const next = { ...prev };
            delete next[placeId];
            return next;
          });
          setLiked(false);
        }
      }
    } catch (error) {
      console.error('위시리스트 처리 중 오류:', error);
    } finally {
      setWishlistLoading(false);
    }
  }, [liked, wishlistLoading, place, placeId, router, locale, setWishlist, showToast]);

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ${fillWidth ? 'w-full min-w-0' : 'flex-shrink-0 w-[300px] sm:w-[280px] max-[480px]:w-[260px]'}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${address}`}
    >
      <div className="relative h-[200px] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            width={300}
            height={200}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 text-slate-500">
            {icon}
          </div>
        )}
        <button
          type="button"
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none border-0 bg-white/90 hover:bg-white transition-all disabled:opacity-60 ${liked ? 'text-red-500' : ''}`}
          onClick={handleWishlistClick}
          aria-label={liked ? '위시리스트에서 제거' : '위시리스트에 추가'}
          aria-pressed={liked}
          disabled={wishlistLoading}
        >
          {liked ? '♥' : '♡'}
        </button>
      </div>
      <div className="p-5">
        <h3 className="text-[1.1rem] font-semibold text-slate-800 mb-2 leading-snug">
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-snug">{address}</p>
        {typeof googleRating === 'number' && typeof googleRatingsTotal === 'number' && (
          <div className="mt-2 text-[0.85rem] text-slate-600">
            Google 평점 {googleRating.toFixed(1)}점 · 리뷰 {googleRatingsTotal}개 기준
          </div>
        )}
      </div>
    </div>
  );
}

// React.memo로 메모이제이션 (place.id 또는 place.place_id로 비교)
export default memo(PlaceCard, (prevProps, nextProps) => {
  const prevId = prevProps.place.place_id || prevProps.place.id;
  const nextId = nextProps.place.place_id || nextProps.place.id;
  return (
    prevId === nextId &&
    prevProps.category === nextProps.category &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.fillWidth === nextProps.fillWidth
  );
});

