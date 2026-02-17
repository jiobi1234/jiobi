'use client';

import { useEffect, useState } from 'react';
import PlaceCard from '../PlaceCard';
import type { Place } from '../../../lib/api-client';
import apiClient from '../../../lib/api-client';

interface RegionPlaceCardsProps {
  region: string;
  onPlaceClick?: (place: Place) => void;
}

export default function RegionPlaceCards({ region, onPlaceClick }: RegionPlaceCardsProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadPlaces = async () => {
      if (!region) return;

      try {
        setLoading(true);
        // 지역별 인기 장소 검색 (키워드 없이 지역만으로 검색)
        const response = await apiClient.hk.searchPlaces('', 1, 6, region);
        const placesData = response.places || [];
        setPlaces(placesData.slice(0, 6)); // 최대 6개만 표시
      } catch (error) {
        console.error('지역 장소 로딩 오류:', error);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [region]);

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    if (places.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % places.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [places.length]);

  if (loading) {
    return (
      <div className="region-cards-loading">
        <div className="loading-spinner" />
        <p>인기 장소를 불러오는 중...</p>
        <style jsx>{`
          .region-cards-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #666;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e9ecef;
            border-top: 3px solid #0064ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="region-cards-empty">
        <p>💡 이 지역의 인기 장소를 찾고 있어요...</p>
        <style jsx>{`
          .region-cards-empty {
            padding: 40px 20px;
            text-align: center;
            color: #666;
            font-size: 0.95rem;
          }
        `}</style>
      </div>
    );
  }

  // 현재 표시할 장소 (한 번에 2개씩 표시)
  const visiblePlaces = places.slice(currentIndex, currentIndex + 2);
  if (visiblePlaces.length < 2 && places.length > 1) {
    visiblePlaces.push(places[0]); // 순환
  }

  return (
    <div className="region-place-cards">
      <div className="cards-header">
        <h4>💡 {region} 인기 장소</h4>
        <p className="cards-subtitle">계획이 완성되면 이 장소들이 포함될 수 있어요</p>
      </div>

      <div className="cards-slider">
        {visiblePlaces.map((place, idx) => {
          const key = place.place_id || place.id || `place-${currentIndex}-${idx}`;
          return (
            <div key={key} className="card-wrapper">
              <PlaceCard
                place={place}
                category="관광지"
                onClick={onPlaceClick}
              />
            </div>
          );
        })}
      </div>

      {/* 인디케이터 */}
      {places.length > 2 && (
        <div className="cards-indicators">
          {places.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`슬라이드 ${idx + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .region-place-cards {
          background: white;
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .cards-header {
          margin-bottom: 16px;
        }

        .cards-header h4 {
          margin: 0 0 6px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .cards-subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }

        .cards-slider {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
        }

        .cards-slider::-webkit-scrollbar {
          height: 4px;
        }

        .cards-slider::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }

        .cards-slider::-webkit-scrollbar-thumb {
          background: #0064ff;
          border-radius: 2px;
        }

        .card-wrapper {
          flex: 0 0 300px;
          scroll-snap-align: start;
        }

        .cards-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #ddd;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .indicator.active {
          background: #0064ff;
          width: 24px;
          border-radius: 4px;
        }

        .indicator:hover {
          background: #0064ff;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .card-wrapper {
            flex: 0 0 280px;
          }

          .cards-header h4 {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
