'use client';

import { useTranslations } from 'next-intl';
import type { Place } from '../../lib/api-client';
import CategoryFilter from './CategoryFilter';
import PlaceCard from './PlaceCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import HorizontalScrollSection from './common/HorizontalScrollSection';

interface HotTravelSectionProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  places: Place[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPlaceClick?: (place: Place) => void; // 선택적 prop으로 변경
}

export default function HotTravelSection({
  selectedFilter,
  onFilterChange,
  places,
  loading,
  error,
  onRetry,
  onPlaceClick, // 선택적 prop
}: HotTravelSectionProps) {
  const t = useTranslations('hk');
  
  return (
    <>
      <section className="hot-travel-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('hotTravelTitle')}</h2>
            <CategoryFilter 
              selectedFilter={selectedFilter}
              onFilterChange={onFilterChange}
            />
          </div>
          
          <div className="scroll-wrapper">
            <HorizontalScrollSection>
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState error={error} onRetry={onRetry} />
              ) : places.length > 0 ? (
                places.map((place, index) => {
                  const key = place.place_id || place.id || `place-${index}`;
                  return (
                    <PlaceCard
                      key={key}
                      place={place}
                      category={selectedFilter}
                      onClick={onPlaceClick} // 선택적 prop 전달
                    />
                  );
                })
              ) : (
                <div className="no-data">{t('noData')}</div>
              )}
            </HorizontalScrollSection>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hot-travel-section {
          padding: 60px 0;
          background: white;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          gap: 20px;
        }

        .section-title {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }

        .scroll-wrapper {
          overflow: hidden;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #999;
          font-size: 1rem;
          background: #f8f9fa;
          border-radius: 15px;
          margin: 20px 0;
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

