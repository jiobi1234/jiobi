/**
 * 가로 스크롤 섹션 공통 컴포넌트
 * HotTravelSection, ThemesSection에서 재사용
 */

import { useRef, ReactNode } from 'react';
import { useHorizontalScroll } from '../../../hooks/common/useHorizontalScroll';

interface HorizontalScrollSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  enableHorizontalWheel?: boolean;
}

export default function HorizontalScrollSection({
  title,
  children,
  className = '',
  enableHorizontalWheel = true,
}: HorizontalScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // React 훅 규칙 준수: 훅은 항상 호출되어야 하므로, 조건부로 빈 배열 또는 ref 배열을 넘김
  useHorizontalScroll(enableHorizontalWheel ? [scrollRef] : []);

  return (
    <>
      <div className={`horizontal-scroll-section ${className}`}>
        {title && (
          <h2 className="section-title">{title}</h2>
        )}
        <div className="scroll-container">
          <div className="scroll-content" ref={scrollRef}>
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        .horizontal-scroll-section {
          padding: 0;
        }

        .section-title {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 30px;
        }

        .scroll-container {
          overflow: hidden;
        }

        .scroll-content {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 20px 0;
          scroll-behavior: smooth;
        }

        .scroll-content::-webkit-scrollbar {
          height: 8px;
        }

        .scroll-content::-webkit-scrollbar-track {
          background: #e9ecef;
          border-radius: 4px;
        }

        .scroll-content::-webkit-scrollbar-thumb {
          background: #0064ff;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

