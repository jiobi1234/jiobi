'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKLayout from '../../../../../components/hk/HKLayout';
import { useToast } from '../../../../../components/hk/common/Toast';
import { getStringParam } from '../../../../../utils/typeGuards';
import '../../../../../styles/hk/travel-stories.css';

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
      <div className="hk-travel-stories-back-button-container">
        <button className="hk-travel-stories-back-button" onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className="hk-travel-stories-container">
        <div className="hk-travel-stories-header">
          <h1 className="hk-travel-stories-title">{t('title')}</h1>
          <p className="hk-travel-stories-description">
            {t('description')}
          </p>
        </div>
        
        <div className="hk-travel-stories-filter-section">
          <div className="hk-travel-stories-search-input-wrapper">
            <input 
              type="text" 
              className="hk-travel-stories-search-input" 
              placeholder={t('searchPlaceholder')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <select 
            className="hk-travel-stories-filter-select" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">{t('sortLatest')}</option>
            <option value="popular">{t('sortPopular')}</option>
          </select>
          
          <select 
            className="hk-travel-stories-filter-select" 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
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
            className="hk-travel-stories-filter-select" 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="">{t('durationAll')}</option>
            <option value="1-2">{t('duration1-2')}</option>
            <option value="3-4">{t('duration3-4')}</option>
            <option value="5-7">{t('duration5-7')}</option>
            <option value="8+">{t('duration8+')}</option>
          </select>
          
          <button className="hk-travel-stories-search-button" onClick={handleSearch}>{t('searchButton')}</button>
        </div>
        
        <div className="hk-travel-stories-grid">
          {stories.length > 0 ? (
            stories.map((story) => (
              <div 
                key={story.id}
                className="hk-travel-stories-card" 
                onClick={() => viewStory(story.id)}
              >
                <div className="hk-travel-stories-image">
                  {story.image ? (
                    <img src={story.image} alt={story.title} />
                  ) : (
                    <div>🏞️</div>
                  )}
                </div>
                
                <div className="hk-travel-stories-content">
                  <h3 className="hk-travel-stories-card-title">{story.title}</h3>
                  <p className="hk-travel-stories-card-description">{story.description}</p>
                  
                  <div className="hk-travel-stories-hashtags">
                    {story.hashtags.map((tag, idx) => (
                      <span key={idx} className="hk-travel-stories-hashtag">{tag}</span>
                    ))}
                  </div>
                  
                  <div className="hk-travel-stories-meta">
                    <div className="hk-travel-stories-author">
                      <div className="hk-travel-stories-author-avatar">
                        {story.author_avatar ? (
                          <img src={story.author_avatar} alt={story.author} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <span className="hk-travel-stories-author-name">{story.author}</span>
                    </div>
                    
                    <div className="hk-travel-stories-stats">
                      <div className="hk-travel-stories-stat-item">
                        <span>{story.duration}</span>
                      </div>
                      <div className="hk-travel-stories-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l9 9z"/>
                        </svg>
                        <span>{story.likes}</span>
                      </div>
                      <div className="hk-travel-stories-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>{story.saves}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="hk-travel-stories-action-button" 
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
            <div className="hk-travel-stories-no-data">{t('noStories')}</div>
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

