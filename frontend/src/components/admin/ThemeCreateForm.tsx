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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-6 md:px-8 md:py-7">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
          {editingThemeId ? '테마 수정' : '테마 만들기'}
        </h2>

        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">테마 이름 (한국어)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={themeNameKo}
              onChange={(e) => setThemeNameKo(e.target.value)}
              placeholder="예: K-Pop & 한류 투어"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">테마 이름 (영어)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={themeNameEn}
              onChange={(e) => setThemeNameEn(e.target.value)}
              placeholder="예: K-Pop & Hallyu Tour"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">장소 추가</label>
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                onClick={() => setShowApiSearch(true)}
              >
                API 장소 검색
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              <input
                type="text"
                className="md:col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="장소 ID"
                value={newPlace.place_id}
                onChange={(e) => setNewPlace({ ...newPlace, place_id: e.target.value })}
              />
              <input
                type="text"
                className="md:col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="장소 이름"
                value={newPlace.title}
                onChange={(e) => setNewPlace({ ...newPlace, title: e.target.value })}
              />
              <input
                type="text"
                className="md:col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="주소 (선택)"
                value={newPlace.address}
                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
              />
              <input
                type="text"
                className="md:col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="이미지 URL (선택)"
                value={newPlace.image}
                onChange={(e) => setNewPlace({ ...newPlace, image: e.target.value })}
              />
              <button
                type="button"
                className="md:col-span-1 inline-flex items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                onClick={handleAddManualPlace}
              >
                추가
              </button>
            </div>
          </div>
        </div>

        {places.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                추가된 장소 <span className="text-slate-500 text-xs">({places.length}개)</span>
              </h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {places.map((place, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{place.title}</p>
                    {place.address && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{place.address}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    onClick={() => onRemovePlace(place.place_id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-400"
            onClick={onSave}
            disabled={!themeNameKo || !themeNameEn || places.length === 0 || isSubmitting}
          >
            {isSubmitting
              ? editingThemeId
                ? '수정 중...'
                : '생성 중...'
              : editingThemeId
                ? '테마 수정'
                : '테마 생성'}
          </button>
          {editingThemeId ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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

