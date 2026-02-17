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
    <>
      <div className="filter-dropdown">
        <select 
          className="filter-select" 
          id="travel-filter"
          value={selectedFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .filter-dropdown {
          flex-shrink: 0;
        }

        .filter-select {
          background: white;
          border: 2px solid #e9ecef;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          min-width: 120px;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
        }

        .filter-select:hover {
          border-color: #0064ff;
          color: #0064ff;
        }

        .filter-select:focus {
          outline: none;
          border-color: #0064ff;
          box-shadow: 0 0 0 3px rgba(0, 100, 255, 0.1);
        }
      `}</style>
    </>
  );
}

