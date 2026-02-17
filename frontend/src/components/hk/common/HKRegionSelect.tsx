'use client';

import { districts, regions } from '../../../constants/regions';

interface HKRegionSelectProps {
  region: string;
  district: string;
  onRegionChange: (region: string) => void;
  onDistrictChange: (district: string) => void;
}

/**
 * HK 앱 전용 지역 선택 컴포넌트
 * 시도와 구/군을 선택할 수 있는 드롭다운
 */
export default function HKRegionSelect({
  region,
  district,
  onRegionChange,
  onDistrictChange,
}: HKRegionSelectProps) {
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRegionChange(e.target.value);
    onDistrictChange(''); // 지역 변경 시 구/군 초기화
  };

  return (
    <>
      <div className="hk-region-select">
        <select 
          className="hk-region-select__region" 
          value={region}
          onChange={handleRegionChange}
          aria-label="지역 선택"
        >
          <option value="">전체</option>
          {regions.map(reg => (
            <option key={reg} value={reg}>{reg}</option>
          ))}
        </select>
        <select 
          className="hk-region-select__district" 
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!region}
          aria-label="구/군 선택"
          aria-disabled={!region}
        >
          <option value="">전체</option>
          {region && districts[region]?.map((dist, index) => (
            <option key={`${region}-${index}-${dist}`} value={dist}>{dist}</option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .hk-region-select {
          display: flex;
          gap: 5px;
        }

        .hk-region-select__region,
        .hk-region-select__district {
          border: none;
          outline: none;
          background: transparent;
          color: var(--hk-text-primary);
          font-size: 14px;
          padding: 0 8px;
          min-width: 60px;
          cursor: pointer;
          transition: var(--hk-transition);
        }

        .hk-region-select__region:hover,
        .hk-region-select__district:hover:not(:disabled) {
          color: var(--hk-primary);
        }

        .hk-region-select__district:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hk-region-select__region option,
        .hk-region-select__district option {
          background: white;
          color: var(--hk-text-primary);
        }
      `}</style>
    </>
  );
}

