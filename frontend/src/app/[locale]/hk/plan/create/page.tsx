'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import HKSearchBar from '../../../../../components/hk/common/HKSearchBar';
import { KakaoMapScript, KakaoMap } from '../../../../../components/hk/map';
import apiClient, { type WishlistItem, type PlanItem, type Place, type SearchPlacesResponse } from '../../../../../lib/api-client';
import { getPlaceId, getPlaceImage } from '../../../../../utils/placeUtils';

interface ItineraryItem {
  id: string;
  place_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  // 지도 표시용 좌표 (백엔드 전송 X, 프론트 전용)
  latitude?: number;
  longitude?: number;
}

export default function PlanCreatePage() {
  const router = useRouter();
  const locale = useLocale();
  const { showToast } = useToast();
  const [planTitle, setPlanTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'search' | 'wishlist'>('search');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 여행 일수 계산
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 1;
  }, [startDate, endDate]);

  const getDateForDay = (day: number): string | null => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (day - 1));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const activeDate = useMemo(() => getDateForDay(activeDay), [activeDay, startDate]);

  // 위시리스트 로딩
  useEffect(() => {
    const loadWishlist = async () => {
      if (!apiClient.auth.isAuthenticated()) {
        setWishlist([]);
        return;
      }

      try {
        setLoadingWishlist(true);
        const res = await apiClient.hk.getWishlist();
        setWishlist(res.items || []);
      } catch (error) {
        console.error('위시리스트 로딩 중 오류:', error);
        setWishlist([]);
      } finally {
        setLoadingWishlist(false);
      }
    };

    loadWishlist();
  }, []);

  const updateItemTime = (id: string, field: 'start_time' | 'end_time', value: string) => {
    setItinerary(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItinerary(prev => prev.filter(item => item.id !== id));
    setSelectedItemId((prev) => (prev === id ? null : prev));
  };

  const handleAddFromWishlist = async (item: WishlistItem) => {
    const date = activeDate;
    if (!date) {
      showToast('error', '먼저 여행 날짜를 설정해주세요.');
      return;
    }
    const id = `${item.place_id}-${Date.now()}-${Math.random()}`;
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      const detail = await apiClient.hk.getPlaceDetail(item.place_id);
      latitude = detail.latitude;
      longitude = detail.longitude;
    } catch {
      // 좌표 없으면 지도에 안 나오지만 일정에는 추가
    }
    setItinerary(prev => [
      ...prev,
      {
        id,
        place_id: item.place_id,
        title: item.title,
        date,
        start_time: '',
        end_time: '',
        latitude,
        longitude,
      },
    ]);
  };

  const handleAddFromSearchResult = (place: Place) => {
    const date = activeDate;
    if (!date) {
      showToast('error', '먼저 여행 날짜를 설정해주세요.');
      return;
    }

    const placeId = (place.place_id || place.id || '').toString();
    if (!placeId) {
      showToast('error', '이 장소는 식별자가 없어 일정을 추가할 수 없습니다.');
      return;
    }

    const title =
      (place.title as string) ||
      (place.place_name as string) ||
      '장소';

    const id = `${placeId}-${Date.now()}-${Math.random()}`;
    setItinerary((prev) => [
      ...prev,
      {
        id,
        place_id: placeId,
        title,
        date,
        start_time: '',
        end_time: '',
        latitude: place.latitude,
        longitude: place.longitude,
      },
    ]);
    setSelectedItemId(id);
  };
  const selectedItem = useMemo(
    () => itinerary.find((i) => i.id === selectedItemId) || null,
    [itinerary, selectedItemId]
  );

  const savePlan = async () => {
    if (!planTitle || !startDate || !endDate) {
      showToast('error', '제목과 날짜를 모두 입력해주세요.');
      return;
    }

    // 로그인 여부 확인
    if (!apiClient.auth.isAuthenticated()) {
      showToast('info', '로그인 후 계획을 저장할 수 있습니다.');
      return;
    }

    if (saving) return;

    setSaving(true);
    try {
      await apiClient.hk.createPlan({
        title: planTitle,
        start_date: startDate,
        end_date: endDate,
        items: itinerary.map<PlanItem>((i) => ({
          place_id: i.place_id,
          date: i.date,
          start_time: i.start_time || undefined,
          end_time: i.end_time || undefined,
        })),
      });
      showToast('success', '여행 계획이 저장되었습니다!');
      // 저장 후 내 여행 페이지로 이동 (또는 추후 계획 상세 페이지로 변경 가능)
      router.push(`/${locale}/hk/mytravel`);
    } catch (error) {
      console.error('계획 저장 중 오류:', error);
      showToast('error', '계획 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchPlaces = async (keyword: string, region?: string, district?: string) => {
    const trimmed = keyword.trim();
    if (!trimmed && !region && !district) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const res: SearchPlacesResponse = await apiClient.hk.searchPlaces(
        trimmed,
        1,
        20,
        region,
        district
      );
      setSearchResults(res.places || []);
    } catch (error) {
      console.error('장소 검색 중 오류:', error);
      showToast('error', '장소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <HKLayout>
      <div className="plan-create-container">
        <div className="plan-header">
          <HKBackButton />
          <h1 className="header-title">새로운 여행 계획 만들기</h1>
        </div>

        <div className="input-section">
          <input 
            type="text" 
            className="title-input" 
            placeholder="여행 계획의 제목을 입력하세요" 
            id="planTitle"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
          />
          <div className="date-inputs">
            <input 
              type="date" 
              className="date-input" 
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>-</span>
            <input 
              type="date" 
              className="date-input" 
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="save-button" onClick={savePlan}>
            저장
          </button>
        </div>

        <div className="plan-main-content">
          {/* 왼쪽: 장소 추가 (위시리스트 / 검색) */}
          <div className="search-panel">
            {/* 탭 버튼 */}
            <div className="search-mode-tabs">
              <button
                className={`search-mode-tab ${searchMode === 'search' ? 'active' : ''}`}
                onClick={() => setSearchMode('search')}
                type="button"
              >
                검색으로 추가
              </button>
              <button
                className={`search-mode-tab ${searchMode === 'wishlist' ? 'active' : ''}`}
                onClick={() => setSearchMode('wishlist')}
                type="button"
              >
                위시리스트로 추가
              </button>
            </div>

            {/* 검색 모드 */}
            {searchMode === 'search' && (
              <>
                <div className="search-bar-wrapper">
                  <HKSearchBar
                    initialKeyword=""
                    onSearch={handleSearchPlaces}
                    debounceMs={400}
                  />
                </div>

                {loadingSearch ? (
                  <p>장소를 검색하는 중입니다...</p>
                ) : searchResults.length === 0 ? (
                  <p>검색 결과가 없습니다. 검색어 또는 지역을 바꿔보세요.</p>
                ) : (
                  <div className="search-results">
                    {searchResults.map((place) => {
                      const placeId = getPlaceId(place);
                      const image = getPlaceImage(place);
                      const title = (place.title as string) ||
                        (place.place_name as string) ||
                        '장소';
                      const address = (place.address as string) ||
                        (place.address_name as string) ||
                        place.addr1 ||
                        '';

                      return (
                        <div
                          key={placeId}
                          className="search-result-item"
                          onClick={() => {
                            if (placeId) {
                              router.push(`/${locale}/hk/${placeId}`);
                            }
                          }}
                        >
                          <div className="result-image">
                            {image ? (
                              <img src={image} alt={title} />
                            ) : (
                              <div className="result-image-placeholder">📍</div>
                            )}
                          </div>
                          <div className="result-info">
                            <div className="result-name">{title}</div>
                            <div className="result-details">{address}</div>
                          </div>
                          <button
                            className="add-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFromSearchResult(place);
                            }}
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 위시리스트 모드 */}
            {searchMode === 'wishlist' && (
              <>
                {loadingWishlist ? (
                  <p>위시리스트를 불러오는 중입니다...</p>
                ) : wishlist.length === 0 ? (
                  <p>위시리스트에 저장된 장소가 없습니다.</p>
                ) : (
                  <div className="search-results">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="search-result-item"
                        onClick={() => {
                          if (item.place_id) {
                            router.push(`/${locale}/hk/${item.place_id}`);
                          }
                        }}
                      >
                        <div className="result-image">
                          {item.image ? (
                            <img src={item.image} alt={item.title} />
                          ) : (
                            <div className="result-image-placeholder">📍</div>
                          )}
                        </div>
                        <div className="result-info">
                          <div className="result-name">{item.title}</div>
                          <div className="result-details">{item.address || ''}</div>
                        </div>
                        <button
                          className="add-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFromWishlist(item);
                          }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 오른쪽: 일정 편집 */}
          <div className="plan-panel">
            <div className="day-tabs">
              {Array.from({ length: dayCount }, (_, idx) => idx + 1).map((day) => (
                <button
                  key={day}
                  className={`day-tab ${activeDay === day ? 'active' : ''}`}
                  onClick={() => setActiveDay(day)}
                >
                  Day {day}
                </button>
              ))}
            </div>

            <div className="itinerary-list">
              {itinerary
                .filter((i) => i.date === activeDate)
                .map((item) => (
                  <div
                    key={item.id}
                    className="itinerary-item"
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={() => {
                      if (!draggingId || draggingId === item.id) return;
                      setItinerary((prev) => {
                        const fromIndex = prev.findIndex((i) => i.id === draggingId);
                        const toIndex = prev.findIndex((i) => i.id === item.id);
                        if (fromIndex === -1 || toIndex === -1) return prev;
                        // 같은 날짜 내에서만 순서 변경
                        if (prev[fromIndex].date !== prev[toIndex].date) return prev;
                        const next = [...prev];
                        const [moved] = next.splice(fromIndex, 1);
                        next.splice(toIndex, 0, moved);
                        return next;
                      });
                      setDraggingId(null);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    <span className="drag-handle">⋮⋮</span>
                    <div className="itinerary-info">
                      <div className="itinerary-name">{item.title}</div>
                      <div className="itinerary-time-inputs">
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) =>
                            updateItemTime(item.id, 'start_time', e.target.value)
                          }
                        />
                        <span> - </span>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) =>
                            updateItemTime(item.id, 'end_time', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="itinerary-actions">
                      <button
                        className="info-btn"
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              {itinerary.filter((i) => i.date === activeDate).length === 0 && (
                <p>이 날짜에는 추가된 일정이 없습니다. 위시리스트에서 장소를 추가해보세요.</p>
              )}
            </div>
          </div>
        </div>

        {/* 지도 섹션: 현재 선택된 날짜(activeDay)의 일정을 지도에 표시 */}
        <div className="plan-map-section">
          <h2 className="plan-map-title">지도에서 보기</h2>
          <KakaoMapScript />
          <KakaoMap
            center={
              itinerary.some((i) => i.date === activeDate && i.latitude && i.longitude)
                ? {
                    lat:
                      itinerary.find((i) => i.date === activeDate && i.latitude && i.longitude)
                        ?.latitude || 37.5665,
                    lng:
                      itinerary.find((i) => i.date === activeDate && i.latitude && i.longitude)
                        ?.longitude || 126.978,
                  }
                : { lat: 37.5665, lng: 126.978 }
            }
            level={7}
            markers={itinerary
              .filter((i) => i.date === activeDate && i.latitude && i.longitude)
              .map((i, index) => ({
                lat: i.latitude as number,
                lng: i.longitude as number,
                title: `${index + 1}. ${i.title}`,
                description: i.start_time || i.end_time ? `${i.start_time || ''} ~ ${i.end_time || ''}` : '',
                onClick: () => setSelectedItemId(i.id),
              }))}
            fitToView
            className="plan-map"
            style={{ height: '320px' }}
          />
          {selectedItem && (
            <div className="plan-map-selected">
              <div className="plan-map-selected-title">{selectedItem.title}</div>
              <div className="plan-map-selected-time">
                {selectedItem.date}{' '}
                {(selectedItem.start_time || selectedItem.end_time) &&
                  `· ${selectedItem.start_time || ''} ~ ${selectedItem.end_time || ''}`}
              </div>
              <button
                type="button"
                className="plan-map-selected-link"
                onClick={() => router.push(`/${locale}/hk/${selectedItem.place_id}`)}
              >
                장소 상세 보기
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .plan-create-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: calc(100vh - 120px);
          width: 100%;
          box-sizing: border-box;
        }

        .plan-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          padding: 20px 0;
          width: 100%;
          position: relative;
        }

        .back-button {
          background: #2c3e50;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: absolute;
          left: 0;
        }

        .back-button:hover {
          background: #34495e;
          transform: scale(1.05);
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          text-align: center;
          margin: 0;
        }

        .save-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: auto;
        }

        .save-button:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .input-section {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          width: 100%;
          box-sizing: border-box;
        }

        .title-input {
          flex: 0 0 600px;
          padding: 15px 20px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .title-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .date-input {
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .plan-main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          height: 800px;
          max-height: 800px;
        }

        .search-panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 800px;
          overflow: hidden;
        }

        .search-mode-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .search-mode-tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #6c757d;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: -2px;
        }

        .search-mode-tab:hover {
          color: #3498db;
        }

        .search-mode-tab.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .search-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
        }

        .search-bar-wrapper {
          margin-bottom: 20px;
        }

        .search-bar {
          position: relative;
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 15px 20px 15px 50px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.2rem;
        }

        .category-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .category-btn {
          padding: 8px 16px;
          border: 2px solid #e9ecef;
          border-radius: 20px;
          background: white;
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-btn.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .category-btn:hover {
          border-color: #3498db;
          color: #3498db;
        }

        .search-actions {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .bookmark-icon {
          color: #2c3e50;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .search-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-btn:hover {
          background: #2980b9;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
          padding-right: 10px;
          max-height: 550px;
          min-height: 300px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          margin-bottom: 10px;
          background: white;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .search-result-item:hover {
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
        }

        .result-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: #e9ecef;
          margin-right: 15px;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .result-image-placeholder {
          font-size: 24px;
          color: #adb5bd;
        }

        .result-info {
          flex: 1;
        }

        .result-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .result-details {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .add-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: #3498db;
          transform: scale(1.1);
        }

        .plan-panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 800px;
          overflow: hidden;
        }

        .day-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .day-tab {
          padding: 10px 20px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          background: white;
          color: #6c757d;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .day-tab.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .day-tab:hover {
          border-color: #3498db;
          color: #3498db;
        }

        .itinerary-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 10px;
          max-height: 550px;
          min-height: 300px;
        }

        .itinerary-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          margin-bottom: 10px;
          background: white;
          transition: all 0.3s ease;
        }

        .drag-handle {
          color: #6c757d;
          font-size: 1.2rem;
          margin-right: 15px;
          cursor: grab;
        }

        .itinerary-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: #e9ecef;
          margin-right: 15px;
        }

        .itinerary-info {
          flex: 1;
        }

        .itinerary-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .itinerary-time {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .itinerary-time-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .itinerary-time-inputs input[type="time"] {
          padding: 6px 10px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
          background: #f8f9fa;
        }

        .itinerary-time-inputs input[type="time"]:focus {
          outline: none;
          border-color: #3498db;
          background: white;
        }

        .itinerary-item {
          cursor: move;
        }

        .itinerary-item[draggable="true"]:hover {
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
        }

        .itinerary-actions {
          display: flex;
          gap: 10px;
        }

        .info-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .info-btn:hover {
          background: #3498db;
        }

        .plan-map-section {
          margin-top: 30px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .plan-map-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 12px;
        }

        .plan-map {
          border-radius: 12px;
          overflow: hidden;
        }

        .plan-map-selected {
          margin-top: 12px;
          padding: 12px 14px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .plan-map-selected-title {
          font-size: 0.98rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .plan-map-selected-time {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 8px;
        }

        .plan-map-selected-link {
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          background: #3498db;
          color: #fff;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .plan-map-selected-link:hover {
          background: #2980b9;
        }

        @media (max-width: 768px) {
          .plan-main-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .input-section {
            flex-direction: column;
            align-items: stretch;
          }

          .date-inputs {
            justify-content: space-between;
          }

          .category-filters {
            justify-content: center;
          }
        }
      `}</style>
    </HKLayout>
  );
}

