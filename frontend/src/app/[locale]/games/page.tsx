'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { getStringParam } from '../../../utils/typeGuards';

const GAMES = [
  { key: 'numbersequence' as const, descKey: 'numberSequenceDesc' as const, icon: '🔢', gradient: 'from-emerald-500 to-teal-600', path: 'numbersequence' },
  { key: 'locationmemory' as const, descKey: 'locationMemoryDesc' as const, icon: '📍', gradient: 'from-sky-500 to-blue-600', path: 'locationmemory' },
  { key: 'flashtrack' as const, descKey: 'flashTrackDesc' as const, icon: '⚡', gradient: 'from-amber-400 to-orange-500', path: 'flashtrack' },
  { key: 'oxquiz' as const, descKey: 'oxQuizDesc' as const, icon: '❓', gradient: 'from-violet-500 to-purple-600', path: 'oxquiz' },
  { key: 'stackdrop' as const, descKey: 'stackDropDesc' as const, icon: '📦', gradient: 'from-rose-500 to-pink-600', path: 'stackdrop' },
  { key: 'reactiontime' as const, descKey: 'reactionTimeDesc' as const, icon: '⏱', gradient: 'from-orange-500 to-red-500', path: 'reactiontime' },
  { key: 'memorytest' as const, descKey: 'memoryTestDesc' as const, icon: '🧠', gradient: 'from-indigo-500 to-blue-600', path: 'memorytest' },
] as const;

export default function GamesPage() {
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('games');

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* 히어로 */}
        <section className="relative pt-20 pb-12 px-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative max-w-6xl mx-auto text-center">
            <p className="text-indigo-300 text-sm font-medium tracking-[0.2em] uppercase mb-3">Mini Games</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">{t('title')}</h1>
            <p className="text-slate-400 text-base">마우스를 올리면 게임 설명을 볼 수 있어요</p>
          </div>
        </section>

        {/* Poki 스타일: 이미지 타일 + 호버 시 설명 */}
        <section className="relative px-4 -mt-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {GAMES.map((game) => (
                <Link
                  key={game.key}
                  href={`/${locale}/games/${game.path}`}
                  className="group block bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* 게임 이미지 영역 (그라데이션 + 아이콘) */}
                  <div className="relative aspect-video">
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                      <span className="text-5xl sm:text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {game.icon}
                      </span>
                    </div>
                    {/* 호버 시 설명 오버레이 */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                      <p className="text-white text-sm leading-relaxed line-clamp-3 mb-3">
                        {t(game.descKey)}
                      </p>
                      <span className={`inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors`}>
                        {t('startGame')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </span>
                    </div>
                  </div>
                  {/* 카드 하단: 게임명만 항상 표시 */}
                  <div className="p-3 text-center">
                    <h3 className="text-sm font-bold text-slate-800 truncate">
                      {t(game.key)}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="inline-block rounded-xl bg-slate-800/90 text-white px-6 py-4 max-w-xl">
                <p className="text-sm text-slate-300">{t('description')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('subDescription')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
