'use client';

import { useState } from 'react';
import type { Place, ThemePlace } from '../../lib/api-client/types';
import PlaceSearchModal from './PlaceSearchModal';

interface ThemeCreateFormProps {
  themeNameKo: string;
  setThemeNameKo: (name: string) => void;
  themeNameEn: string;
  setThemeNameEn: (name: string) => void;
  places: ThemePlace[];
  editingThemeId: string | null;
  isSubmitting: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onAddPlace: (place: ThemePlace) => void;
  onRemovePlace: (placeId: string) => void;
}

/**
 * 테마 생성/수정 폼 컴포넌트
 */
export default function ThemeCreateForm({
  themeNameKo,
  setThemeNameKo,
  themeNameEn,
  setThemeNameEn,
  places,
  editingThemeId,
  isSubmitting,
  message,
  onSave,
  onCancel,
  onAddPlace,
  onRemovePlace,
}: ThemeCreateFormProps) {
  const [showApiSearch, setShowApiSearch] = useState(false);
  const [newPlace, setNewPlace] = useState({
    place_id: '',
    title: '',
    address: '',
    image: ''
  });

  const handleSelectPlaceFromApi = (place: Place) => {
    const themePlace: ThemePlace = {
      place_id: place.place_id || place.id || '',
      title: place.title || place.place_name || '',
      address: place.address || place.addr1 || '',
      image: place.image || ''
    };
    onAddPlace(themePlace);
  };

  const handleAddManualPlace = () => {
    if (newPlace.place_id && newPlace.title) {
      onAddPlace({ ...newPlace });
      setNewPlace({ place_id: '', title: '', address: '', image: '' });
    }
  };

  const handleReset = () => {
    setThemeNameKo('');
    setThemeNameEn('');
    setNewPlace({ place_id: '', title: '', address: '', image: '' });
  };

  return (
    <>
      <div className="theme-create-section">
        <h2 className="section-title">
          {editingThemeId ? '테마 수정' : '테마 만들기'}
        </h2>
        
        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">테마 이름 (한국어)</label>
          <input
            type="text"
            className="form-input"
            value={themeNameKo}
            onChange={(e) => setThemeNameKo(e.target.value)}
            placeholder="예: K-Pop & 한류 투어"
          />
        </div>

        <div className="form-group">
          <label className="form-label">테마 이름 (영어)</label>
          <input
            type="text"
            className="form-input"
            value={themeNameEn}
            onChange={(e) => setThemeNameEn(e.target.value)}
            placeholder="예: K-Pop & Hallyu Tour"
          />
        </div>

        <div className="form-group">
          <label className="form-label">장소 추가</label>
          <div className="place-add-options">
            <button
              type="button"
              className="btn-api-search"
              onClick={() => setShowApiSearch(true)}
            >
              API 장소 검색
            </button>
          </div>

          <div className="place-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="장소 ID"
              value={newPlace.place_id}
              onChange={(e) => setNewPlace({ ...newPlace, place_id: e.target.value })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="장소 이름"
              value={newPlace.title}
              onChange={(e) => setNewPlace({ ...newPlace, title: e.target.value })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="주소 (선택)"
              value={newPlace.address}
              onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="이미지 URL (선택)"
              value={newPlace.image}
              onChange={(e) => setNewPlace({ ...newPlace, image: e.target.value })}
            />
            <button
              type="button"
              className="btn-add-place"
              onClick={handleAddManualPlace}
            >
              추가
            </button>
          </div>
        </div>

        {places.length > 0 && (
          <div className="places-list">
            <h3 className="places-list-title">추가된 장소 ({places.length}개)</h3>
            <div className="places-items">
              {places.map((place, index) => (
                <div key={index} className="place-item">
                  <div className="place-info">
                    <strong>{place.title}</strong>
                    {place.address && <span className="place-address">{place.address}</span>}
                  </div>
                  <button
                    type="button"
                    className="btn-remove-place"
                    onClick={() => onRemovePlace(place.place_id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-submit"
            onClick={onSave}
            disabled={!themeNameKo || !themeNameEn || places.length === 0 || isSubmitting}
          >
            {isSubmitting 
              ? (editingThemeId ? '수정 중...' : '생성 중...') 
              : (editingThemeId ? '테마 수정' : '테마 생성')
            }
          </button>
          {editingThemeId ? (
            <button
              type="button"
              className="btn-reset"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
          ) : (
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <PlaceSearchModal
        isOpen={showApiSearch}
        onClose={() => setShowApiSearch(false)}
        onSelectPlace={handleSelectPlaceFromApi}
      />
    </>
  );
}

