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
    <section className="py-12 bg-white">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="flex flex-col items-center gap-3 mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {t('hotTravelTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            지금 많이 찾는 인기 여행지들을 모았어요.
          </p>
          <CategoryFilter
            selectedFilter={selectedFilter}
            onFilterChange={onFilterChange}
          />
        </div>

        <div className="mt-2">
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
                    onClick={onPlaceClick}
                  />
                );
              })
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-slate-500 bg-slate-50 rounded-2xl">
                {t('noData')}
              </div>
            )}
          </HorizontalScrollSection>
        </div>
      </div>
    </section>
  );
}

