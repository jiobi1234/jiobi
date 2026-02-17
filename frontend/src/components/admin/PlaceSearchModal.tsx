'use client';

import { useState } from 'react';
import type { Place, ThemePlace } from '../../lib/api-client/types';

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
}

/**
 * 장소 검색 모달 컴포넌트
 * API를 통해 장소를 검색하고 선택할 수 있는 UI
 */
export default function PlaceSearchModal({ isOpen, onClose, onSelectPlace }: PlaceSearchModalProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // useHKSearch 훅을 사용하지 않고 직접 구현 (모달 내부에서만 사용)
  const handleApiSearch = async () => {
    if (!searchKeyword.trim() && !searchRegion.trim() && !searchDistrict.trim()) {
      setSearchError('검색어 또는 지역 정보를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const { default: apiClient } = await import('../../lib/api-client');
      const response = await apiClient.hk.searchPlaces(
        searchKeyword,
        1,
        20,
        searchRegion || undefined,
        searchDistrict || undefined
      );
      setSearchResults(response.places || []);
      if (response.places && response.places.length === 0) {
        setSearchError('검색 결과가 없습니다.');
      }
    } catch (error: any) {
      console.error('장소 검색 실패:', error);
      setSearchError(error?.message || '장소 검색에 실패했습니다.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPlace = (place: Place) => {
    onSelectPlace(place);
    // 선택 후 검색 결과 초기화 (선택사항)
    // setSearchResults([]);
    // setSearchKeyword('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>장소 검색</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="api-search-section">
          <div className="api-search-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="장소 이름 또는 키워드"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApiSearch();
                }
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="지역 (시/도, 예: 서울, 경기)"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApiSearch();
                }
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="구/군 (선택, 예: 강남구)"
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApiSearch();
                }
              }}
            />
            <button
              type="button"
              className="btn-search"
              onClick={handleApiSearch}
              disabled={searchLoading || (!searchKeyword.trim() && !searchRegion.trim() && !searchDistrict.trim())}
            >
              {searchLoading ? '검색 중...' : '검색'}
            </button>
          </div>

          {searchError && (
            <div className="search-error">{searchError}</div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results">
              <h4 className="search-results-title">검색 결과 ({searchResults.length}개)</h4>
              <div className="search-results-list">
                {searchResults.map((place) => (
                  <div key={place.place_id || place.id} className="search-result-item">
                    {place.image && (
                      <img 
                        src={place.image} 
                        alt={place.title || place.place_name || ''}
                        className="result-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="result-info">
                      <strong className="result-title">
                        {place.title || place.place_name || '이름 없음'}
                      </strong>
                      <div className="result-details">
                        {(place.address || place.addr1) && (
                          <span className="result-address">
                            {place.address || place.addr1}
                          </span>
                        )}
                        {(place.place_id || place.id) && (
                          <span className="result-id">
                            ID: {place.place_id || place.id}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-select-place"
                      onClick={() => handleSelectPlace(place)}
                    >
                      선택
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1001;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #333;
        }

        .api-search-input-group {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr auto;
          gap: 10px;
          margin-bottom: 20px;
        }

        .form-input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .btn-search {
          padding: 10px 20px;
          background: #333;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-search:hover:not(:disabled) {
          background: #555;
        }

        .btn-search:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .search-error {
          color: #d32f2f;
          padding: 10px;
          background: #ffebee;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .search-results {
          margin-top: 20px;
        }

        .search-results-title {
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 15px;
        }

        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-result-item:hover {
          border-color: #333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .result-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-title {
          font-size: 1rem;
          color: #333;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.85rem;
          color: #666;
        }

        .result-address {
          color: #666;
        }

        .result-id {
          color: #999;
          font-size: 0.8rem;
        }

        .btn-select-place {
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          flex-shrink: 0;
        }

        .btn-select-place:hover {
          background: #555;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 16px;
          }

          .api-search-input-group {
            grid-template-columns: 1fr;
          }

          .search-result-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .result-image {
            width: 100%;
            height: 150px;
          }
        }
      `}</style>
    </>
  );
}

