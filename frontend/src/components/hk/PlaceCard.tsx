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
  onClick?: (place: Place) => void; // 선택적 prop으로 변경
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

function PlaceCard({ place, category, onClick }: PlaceCardProps) {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const { setNavigationHistory } = useHKContext();
  const { showToast } = useToast();
  
  const title = getPlaceTitle(place);
  const address = getPlaceAddress(place);
  const image = getPlaceImage(place);
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
    <>
      <div 
        className="travel-card"
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
        <div className="travel-image">
          {image ? (
            <Image 
              src={image} 
              alt={title}
              width={300}
              height={200}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              unoptimized
            />
          ) : (
            <div className="no-image">{icon}</div>
          )}
          {/* 위시리스트 하트 버튼 */}
          <button
            type="button"
            className={`wishlist-button ${liked ? 'wishlist-button--active' : ''}`}
            onClick={handleWishlistClick}
            aria-label={liked ? '위시리스트에서 제거' : '위시리스트에 추가'}
            aria-pressed={liked}
            disabled={wishlistLoading}
          >
            {liked ? '♥' : '♡'}
          </button>
        </div>
        <div className="travel-content">
          <h3>{title}</h3>
          <p>{address}</p>
        </div>
      </div>

      <style jsx>{`
        .travel-card {
          flex: 0 0 300px;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .travel-card:hover {
          transform: translateY(-5px);
        }

        .travel-image {
          height: 200px;
          overflow: hidden;
          position: relative;
        }

        .travel-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          background: #f8f9fa;
          color: #6c757d;
        }

        .wishlist-button {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          transition: all 0.2s ease;
        }

        .wishlist-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.05);
        }

        .wishlist-button--active {
          color: #e03131;
        }

        .travel-content {
          padding: 20px;
        }

        .travel-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .travel-content p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .travel-card {
            flex: 0 0 280px;
          }
        }

        @media (max-width: 480px) {
          .travel-card {
            flex: 0 0 260px;
          }
        }
      `}</style>
    </>
  );
}

// React.memo로 메모이제이션 (place.id 또는 place.place_id로 비교)
export default memo(PlaceCard, (prevProps, nextProps) => {
  const prevId = prevProps.place.place_id || prevProps.place.id;
  const nextId = nextProps.place.place_id || nextProps.place.id;
  
  return (
    prevId === nextId &&
    prevProps.category === nextProps.category &&
    prevProps.onClick === nextProps.onClick
  );
});

