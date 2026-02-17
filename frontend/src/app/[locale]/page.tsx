'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getStringParam } from '../../utils/typeGuards';

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('common');

  const handleCardClick = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  return (
    <>
      <Navbar />
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12">
        {/* 환영 메시지 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[#495057]">{t('welcome')}</h2>
        </div>

        {/* 4개 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 유틸 카드 */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleCardClick('/util')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#495057] mb-2">{t('util')}</h3>
              <p className="text-sm text-[#495057] opacity-75">{t('utilDescription')}</p>
            </div>
          </div>

          {/* 게임 카드 */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleCardClick('/games/')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#495057] mb-2">{t('games')}</h3>
              <p className="text-sm text-[#495057] opacity-75">{t('gamesDescription')}</p>
            </div>
          </div>

          {/* 블로그 카드 */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleCardClick('/blog')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#495057] mb-2">{t('blog')}</h3>
              <p className="text-sm text-[#495057] opacity-75">{t('blogDescription')}</p>
            </div>
          </div>

          {/* 투어 카드 */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleCardClick('/hk')}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#373e56]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#495057] mb-2">{t('tour')}</h3>
              <p className="text-sm text-[#495057] opacity-75">{t('tourDescription')}</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

