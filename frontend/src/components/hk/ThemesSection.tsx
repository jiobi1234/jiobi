'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ThemeCard from './ThemeCard';
import HorizontalScrollSection from './common/HorizontalScrollSection';
import { getStringParam } from '../../utils/typeGuards';
import { useHKThemes } from '../../hooks/hk/useHKThemes';

// 테마 이름에 따른 이모지 매핑
const getEmojiForTheme = (themeName: string): string => {
  const emojiMap: { [key: string]: string } = {
    'kpop': '🎵',
    'food': '🍽️',
    'culture': '🏛️',
    'nature': '🌿',
  };
  return emojiMap[themeName.toLowerCase()] || '🌟';
};

export default function ThemesSection() {
  const router = useRouter();
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'ko';
  const t = useTranslations('hk');
  const { themes, loading, error } = useHKThemes();

  const handleThemeClick = (themeId: string) => {
    router.push(`/${locale}/hk/theme/${themeId}`);
  };

  return (
    <section className="py-10 bg-slate-50">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {t('themesTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-200 sm:text-sm">
            지금 우리 여행 스타일에 맞는 테마를 골라보세요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-500 bg-white border rounded-2xl border-slate-200">
            테마를 불러오는 중...
          </div>
        ) : error || themes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-500 bg-white border rounded-2xl border-slate-200">
            {error || '등록된 테마가 없습니다.'}
          </div>
        ) : (
          <HorizontalScrollSection enableHorizontalWheel={false}>
            {themes.map((theme) => {
              const themeName = locale === 'ko' ? theme.name_ko : theme.name_en;
              return (
                <ThemeCard
                  key={theme.id}
                  emoji={getEmojiForTheme(themeName)}
                  title={themeName}
                  themeName={theme.id}
                  onThemeClick={handleThemeClick}
                />
              );
            })}
          </HorizontalScrollSection>
        )}
      </div>
    </section>
  );
}

