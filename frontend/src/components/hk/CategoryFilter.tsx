'use client';

import { useTranslations } from 'next-intl';

interface CategoryFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function CategoryFilter({ selectedFilter, onFilterChange }: CategoryFilterProps) {
  const t = useTranslations('hk.categories');
  
  const filterOptions = [
    { value: 'restaurant', labelKey: 'restaurant' },
    { value: 'shopping', labelKey: 'shopping' },
    { value: 'accommodation', labelKey: 'accommodation' },
    { value: 'travel_course', labelKey: 'travel_course' },
  ];
  return (
    <div className="shrink-0">
      <select
        id="travel-filter"
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="min-w-[120px] py-2.5 pl-4 pr-10 text-sm bg-white border-2 border-slate-200 rounded-2xl cursor-pointer appearance-none bg-no-repeat bg-[length:16px] bg-[right_12px_center] hover:border-sky-500 hover:text-sky-600 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-700"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
        }}
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

