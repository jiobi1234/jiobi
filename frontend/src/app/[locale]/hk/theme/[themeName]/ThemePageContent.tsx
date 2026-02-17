'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { logError } from '../../../../../utils/logger';
import { getStringParam } from '../../../../../utils/typeGuards';
import { useToast } from '../../../../../components/hk/common/Toast';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import { useHKTheme } from '../../../../../hooks/hk/useHKTheme';
import '../../../../../styles/hk/theme.css';

/**
 * 테마 페이지 컨텐츠
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
export default function ThemePageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const themeId = getStringParam(params, 'themeName') || '';
  const { showToast } = useToast();
  
  const { theme, loading, error } = useHKTheme(themeId);

  // 테마 이름 (현재 locale에 맞게)
  const themeTitle = theme ? (locale === 'ko' ? theme.name_ko : theme.name_en) : '';
  const places = theme?.places || [];

  const handlePlaceClick = (placeId: string) => {
    router.push(`/${locale}/hk/${placeId}`);
  };

  const addToFavorites = (placeTitle: string) => {
    showToast('success', `${placeTitle}을(를) 즐겨찾기에 추가했습니다!`);
  };

  const toggleBookmark = (placeTitle: string) => {
    showToast('success', `${placeTitle}을(를) 북마크했습니다!`);
  };

  const sharePlace = async (placeTitle: string, placeId: string) => {
    const shareUrl = `${window.location.origin}/${locale}/hk/${placeId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: placeTitle,
          text: `${placeTitle} - ${themeTitle}`,
          url: shareUrl
        });
      } catch (err) {
        logError('공유 실패', err, 'ThemePage');
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('success', '링크가 클립보드에 복사되었습니다!');
      });
    }
  };

  const createTravelPlan = () => {
    router.push(`/${locale}/hk/plan/select`);
  };

  if (loading) {
    return (
      <div className="theme-page-container">
        <div className="loading-state">테마를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="hk-theme-page-container">
        <div className="hk-theme-error-state">{error || '테마를 찾을 수 없습니다.'}</div>
      </div>
    );
  }

  return (
    <>
      <div className="hk-theme-back-button-container">
        <HKBackButton variant="ghost" />
      </div>

      <div className="hk-theme-page-container">
        <div className="hk-theme-header">
          <h1 className="hk-theme-title">{themeTitle}</h1>
        </div>
        
        <div className="hk-theme-places-container">
          {places.length > 0 ? (
            places.map((place, idx) => (
              <div 
                key={idx}
                className="hk-theme-place-card" 
                onClick={() => handlePlaceClick(place.place_id)}
              >
                <div className="hk-theme-place-image">
                  {place.image ? (
                    <Image 
                      src={place.image} 
                      alt={place.title || '장소 이미지'}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      unoptimized
                    />
                  ) : (
                    <div>🏢</div>
                  )}
                </div>
                
                <div className="hk-theme-place-content">
                  <div>
                    <h3 className="hk-theme-place-title">{place.title || '장소명 없음'}</h3>
                    {place.address && (
                      <p className="hk-theme-place-address">{place.address}</p>
                    )}
                  </div>
                  
                  <div className="hk-theme-place-actions">
                    <button 
                      className="hk-theme-action-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToFavorites(place.title);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                    <button 
                      className="hk-theme-action-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(place.title);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l9 9z"/>
                      </svg>
                    </button>
                    <button 
                      className="hk-theme-action-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        sharePlace(place.title, place.place_id);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="hk-theme-no-places">해당 테마의 장소가 없습니다.</div>
          )}
        </div>
        
        <button className="hk-theme-floating-action" onClick={createTravelPlan}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>여행 계획 만들기</span>
        </button>
      </div>
    </>
  );
}
