'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../../utils/typeGuards';
import HKButton from './common/HKButton';

export default function HeroSection() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('hk');
  const [keyword, setKeyword] = useState('');

  const handlePlanClick = (type: 'ai' | 'manual') => {
    if (type === 'ai') {
      window.location.href = `/${locale}/hk/plan/ai`;
    } else {
      router.push(`/${locale}/hk/plan/create`);
    }
  };

  const handleSearch = useCallback(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    router.push(`/${locale}/hk/search?q=${encodeURIComponent(trimmed)}`);
  }, [keyword, router, locale]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <section className="bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:py-24">
        <h1
          className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
          dangerouslySetInnerHTML={{ __html: t('heroTitle') }}
        />
        <p className="mb-8 max-w-2xl text-sm text-slate-600 sm:text-base">
          AI가 짜주는 일정으로 동선 걱정은 줄이고, 여행의 설렘만 챙기세요.
          내 여행을 한 곳에 모아서, 언제든 다시 꺼내볼 수 있어요.
        </p>

        {/* 검색바 */}
        <div className="mb-6 flex w-full justify-center">
          <div className="flex w-full max-w-2xl items-center rounded-full border border-slate-200 bg-white px-4 shadow-sm">
            <span className="ml-2 text-lg text-slate-400" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="어디로 떠나볼까요?"
              className="ml-3 flex-1 border-0 bg-transparent px-1 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              aria-label="여행지 검색어 입력"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="ml-2 hidden rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 sm:inline-flex"
            >
              검색
            </button>
          </div>
        </div>

        {/* CTA 버튼들 */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <HKButton
            size="lg"
            className="px-8 py-3 text-base shadow-sm bg-sky-500 text-white hover:bg-sky-600"
            onClick={() => handlePlanClick('ai')}
          >
            {t('createPlanAi')}
          </HKButton>
          <HKButton
            variant="outline"
            size="lg"
            className="border-slate-200 px-8 py-3 text-base text-slate-900 hover:bg-slate-50"
            onClick={() => handlePlanClick('manual')}
          >
            {t('createPlanManual')}
          </HKButton>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          로그인 없이도 계획을 만들어 볼 수 있어요. 저장할 때만 로그인하면 됩니다.
        </p>
      </div>
    </section>
  );
}

