'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { logError } from '../../../../../utils/logger';
import { getStringParam } from '../../../../../utils/typeGuards';
import { useToast } from '../../../../../components/hk/common/Toast';
import HKBackButton from '../../../../../components/hk/common/HKBackButton';
import { useHKTheme } from '../../../../../hooks/hk/useHKTheme';

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
      <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-100 min-h-screen">
        <div className="text-center py-16 text-lg text-slate-600">테마를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-100 min-h-screen">
        <div className="text-center py-16 text-lg text-red-600">{error || '테마를 찾을 수 없습니다.'}</div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-5 left-5 z-[1000]">
        <HKBackButton variant="ghost" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 bg-slate-100 min-h-screen">
        <div className="flex items-center justify-center mb-6 sm:mb-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 m-0 text-center">{themeTitle}</h1>
        </div>

        <div className="flex flex-col gap-5">
          {places.length > 0 ? (
            places.map((place, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-5 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                onClick={() => handlePlaceClick(place.place_id)}
              >
                <div className="w-full sm:w-[120px] h-[200px] sm:h-[120px] rounded-xl bg-slate-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                  {place.image ? (
                    <Image
                      src={place.image}
                      alt={place.title || '장소 이미지'}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded-xl"
                      unoptimized
                    />
                  ) : (
                    <span>🏢</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 m-0 mb-2">{place.title || '장소명 없음'}</h3>
                    {place.address && (
                      <p className="text-slate-500 text-sm m-0 mb-3">{place.address}</p>
                    )}
                  </div>
                  <div className="flex gap-2.5 items-center justify-end sm:justify-end">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300"
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
                      type="button"
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300"
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
                      type="button"
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300"
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
            <div className="text-center py-10 text-slate-500 text-lg">해당 테마의 장소가 없습니다.</div>
          )}
        </div>

        <button
          type="button"
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-slate-800 text-white border-0 rounded-xl py-3.5 px-5 flex items-center gap-2.5 cursor-pointer shadow-lg hover:bg-slate-600 hover:-translate-y-0.5 transition"
          onClick={createTravelPlan}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>여행 계획 만들기</span>
        </button>
      </div>
    </>
  );
}
