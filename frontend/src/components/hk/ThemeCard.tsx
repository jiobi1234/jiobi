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
    <>
      <div 
        className="theme-card"
        role="article"
        aria-label={`${title} 테마 카드`}
      >
        <div className="theme-image" aria-hidden="true">
          <div className="theme-placeholder">{emoji}</div>
        </div>
        <h3>{title}</h3>
        <div className="theme-button-wrapper">
          <HKButton 
            variant="outline"
            size="sm"
            onClick={handleClick}
            aria-label={`${title} 테마로 여행 계획 만들기`}
          >
            이 테마로 계획 만들기
          </HKButton>
        </div>
      </div>

      <style jsx>{`
        .theme-card {
          flex: 0 0 280px;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .theme-card:hover {
          transform: translateY(-5px);
        }

        .theme-image {
          height: 180px;
          overflow: hidden;
        }

        .theme-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .theme-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .theme-card h3 {
          padding: 20px 20px 10px;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .theme-button-wrapper {
          margin: 0 20px 20px;
        }

        @media (max-width: 768px) {
          .theme-card {
            flex: 0 0 250px;
          }
        }

        @media (max-width: 480px) {
          .theme-card {
            flex: 0 0 220px;
          }
        }
      `}</style>
    </>
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

