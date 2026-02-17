'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { getStringParam } from '../../../utils/typeGuards';

export default function GamesPage() {
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('games');

  return (
    <>
      <Navbar />
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-10 text-center">🎮 {t('title')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 max-w-6xl mx-auto">
          
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🔢</div>
              <h3 className="text-xl font-semibold text-green-600">{t('numbersequence')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('numberSequenceDesc')}</p>
            <Link href={`/${locale}/games/numbersequence`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="text-xl font-semibold text-green-600">{t('locationmemory')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('locationMemoryDesc')}</p>
            <Link href={`/${locale}/games/locationmemory`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-xl font-semibold text-green-600">{t('flashtrack')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('flashTrackDesc')}</p>
            <Link href={`/${locale}/games/flashtrack`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">❓</div>
              <h3 className="text-xl font-semibold text-green-600">{t('oxquiz')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('oxQuizDesc')}</p>
            <Link href={`/${locale}/games/oxquiz`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="text-xl font-semibold text-green-600">{t('stackdrop')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('stackDropDesc')}</p>
            <Link href={`/${locale}/games/stackdrop`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-xl font-semibold text-green-600">{t('reactiontime')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('reactionTimeDesc')}</p>
            <Link href={`/${locale}/games/reactiontime`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🧠</div>
              <h3 className="text-xl font-semibold text-green-600">{t('memorytest')}</h3>
            </div>
            <p className="text-gray-600 mb-4 text-center">{t('memoryTestDesc')}</p>
            <Link href={`/${locale}/games/memorytest`} className="block w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 text-center transition-colors">
              {t('startGame')}
            </Link>
          </div>

        </div>

        {/* 하단 설명 */}
        <div className="text-center text-gray-600 mt-12">
          <p className="text-lg font-medium mb-2">{t('description')}</p>
          <p className="text-sm">{t('subDescription')}</p>
        </div>
      </section>
      <Footer />
    </>
  );
}

