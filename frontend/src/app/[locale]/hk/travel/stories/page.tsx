'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';
import { getStringParam } from '../../../../../utils/typeGuards';

interface TravelStory {
  id: number;
  title: string;
  description: string;
  image?: string;
  hashtags: string[];
  author: string;
  author_avatar?: string;
  duration: string;
  likes: number;
  saves: number;
}

/**
 * 여행 스토리 페이지 컨텐츠
 * (HKLayout 내부에서 렌더링되므로 ToastProvider 사용 가능)
 */
function TravelStoriesPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk.travelStories');
  const { showToast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState('');
  const [stories, setStories] = useState<TravelStory[]>([]);

  // 샘플 데이터 (실제로는 API에서 가져옴)
  useEffect(() => {
    setStories([
      {
        id: 1,
        title: '서울 3일 여행 코스',
        description: '서울의 핫플레이스를 모두 담은 완벽한 3일 여행 계획입니다.',
        hashtags: ['#서울', '#3일여행', '#핫플'],
        author: '여행러버',
        duration: '3일',
        likes: 120,
        saves: 45
      },
      // 더 많은 샘플 데이터...
    ]);
  }, []);

  const handleSearch = () => {
    // 검색 로직
    console.log('검색:', { searchKeyword, sortBy, region, duration });
  };

  const viewStory = (storyId: number) => {
    router.push(`/${locale}/hk/travel/story/${storyId}`);
  };

  const addToMyTravel = (storyId: number) => {
    console.log('내 여행에 추가:', storyId);
    showToast('success', t('addedToMyTravel'));
  };

  return (
    <>
      <div className="fixed top-5 left-5 z-[1000]">
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-black/70 text-white border-0 flex items-center justify-center cursor-pointer hover:bg-black/90 hover:scale-110 transition"
          onClick={() => router.back()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 bg-slate-100 min-h-screen">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 m-0 mb-5">{t('title')}</h1>
          <p className="text-lg text-slate-600 leading-relaxed m-0">{t('description')}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-10 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-3 px-4 border-2 border-slate-200 rounded-xl bg-white text-base cursor-pointer min-w-[120px] focus:outline-none focus:border-sky-500"
          >
            <option value="latest">{t('sortLatest')}</option>
            <option value="popular">{t('sortPopular')}</option>
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="py-3 px-4 border-2 border-slate-200 rounded-xl bg-white text-base cursor-pointer min-w-[120px] focus:outline-none focus:border-sky-500"
          >
            <option value="">{t('regionAll')}</option>
            <option value="서울">{t('regionSeoul')}</option>
            <option value="부산">{t('regionBusan')}</option>
            <option value="제주">{t('regionJeju')}</option>
            <option value="강원">{t('regionGangwon')}</option>
            <option value="경기">{t('regionGyeonggi')}</option>
            <option value="전라">{t('regionJeolla')}</option>
          </select>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="py-3 px-4 border-2 border-slate-200 rounded-xl bg-white text-base cursor-pointer min-w-[120px] focus:outline-none focus:border-sky-500"
          >
            <option value="">{t('durationAll')}</option>
            <option value="1-2">{t('duration1-2')}</option>
            <option value="3-4">{t('duration3-4')}</option>
            <option value="5-7">{t('duration5-7')}</option>
            <option value="8+">{t('duration8+')}</option>
          </select>
          <button
            type="button"
            className="py-3 px-6 bg-sky-600 text-white border-0 rounded-xl text-base font-semibold cursor-pointer hover:bg-sky-700"
            onClick={handleSearch}
          >
            {t('searchButton')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.length > 0 ? (
            stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition cursor-pointer"
                onClick={() => viewStory(story.id)}
              >
                <div className="h-44 bg-slate-200 flex items-center justify-center text-4xl overflow-hidden">
                  {story.image ? (
                    <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>🏞️</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{story.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">{story.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.hashtags.map((tag, idx) => (
                      <span key={idx} className="py-1 px-2 rounded-lg bg-sky-100 text-sky-700 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">
                        {story.author_avatar ? (
                          <img src={story.author_avatar} alt={story.author} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <span className="text-sm text-slate-600">{story.author}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{story.duration}</span>
                      <span className="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l9 9z"/>
                        </svg>
                        {story.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        {story.saves}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2.5 bg-sky-600 text-white border-0 rounded-xl text-sm font-semibold cursor-pointer hover:bg-sky-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToMyTravel(story.id);
                    }}
                  >
                    {t('travelWithPlan')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500 text-lg">{t('noStories')}</div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * 여행 스토리 페이지 (Wrapper)
 * HKLayout을 제공하여 ToastProvider 사용 가능하도록 함
 */
export default function TravelStoriesPage() {
  return (
    <HKLayout>
      <TravelStoriesPageContent />
    </HKLayout>
  );
}

