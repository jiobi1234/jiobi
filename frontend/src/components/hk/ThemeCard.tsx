'use client';

import { memo, useCallback } from 'react';
import HKButton from './common/HKButton';

interface ThemeCardProps {
  emoji: string;
  title: string;
  themeName: string;
  onThemeClick: (themeName: string) => void;
}

function ThemeCard({ emoji, title, themeName, onThemeClick }: ThemeCardProps) {
  const handleClick = useCallback(() => {
    onThemeClick(themeName);
  }, [themeName, onThemeClick]);
  return (
    <div
      className="flex w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[260px] md:w-[280px]"
      role="article"
      aria-label={`${title} 테마 카드`}
    >
      <div
        className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-500 to-violet-500 text-5xl text-white sm:h-44"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-sm font-semibold tracking-tight text-slate-50 sm:text-base">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          이 테마에 맞는 인기 장소와 동선을 한 번에 모아보세요.
        </p>
        <div className="mt-4">
          <HKButton
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="w-full border-slate-700 bg-slate-900/60 text-slate-100 hover:border-sky-500 hover:bg-slate-900"
            aria-label={`${title} 테마로 여행 계획 만들기`}
          >
            이 테마로 계획 만들기
          </HKButton>
        </div>
      </div>
    </div>
  );
}

// React.memo로 메모이제이션
export default memo(ThemeCard, (prevProps, nextProps) => {
  return (
    prevProps.themeName === nextProps.themeName &&
    prevProps.title === nextProps.title &&
    prevProps.emoji === nextProps.emoji &&
    prevProps.onThemeClick === nextProps.onThemeClick
  );
});

