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

  if (loading) {
    return (
      <HorizontalScrollSection 
        title={t('themesTitle')}
        className="themes-section"
      >
        <div className="loading-state">테마를 불러오는 중...</div>
        <style jsx>{`
          .themes-section {
            background: #f8f9fa;
          }
          .loading-state {
            padding: 40px;
            text-align: center;
            color: var(--hk-text-secondary);
          }
        `}</style>
      </HorizontalScrollSection>
    );
  }

  if (error || themes.length === 0) {
    return (
      <HorizontalScrollSection 
        title={t('themesTitle')}
        className="themes-section"
        enableHorizontalWheel={false}
      >
        <div className="empty-state">
          {error || '등록된 테마가 없습니다.'}
        </div>
        <style jsx>{`
          .themes-section {
            background: #f8f9fa;
          }
          .empty-state {
            padding: 40px;
            text-align: center;
            color: var(--hk-text-secondary);
          }
        `}</style>
      </HorizontalScrollSection>
    );
  }

  return (
    <HorizontalScrollSection 
      title={t('themesTitle')}
      className="themes-section"
      enableHorizontalWheel={false}
    >
      {themes.map((theme) => {
        // 현재 locale에 맞는 테마 이름 선택
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
      <style jsx>{`
        .themes-section {
          background: #f8f9fa;
        }
      `}</style>
    </HorizontalScrollSection>
  );
}

