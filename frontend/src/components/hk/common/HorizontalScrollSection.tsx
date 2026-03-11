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
    <section className={className}>
      {title && (
        <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">
          {title}
        </h2>
      )}
      <div className="flex overflow-x-auto overflow-y-hidden pb-2">
        <div
          ref={scrollRef}
          className="inline-flex gap-5 py-3 [scrollbar-color:theme(colors.slate.600)_transparent] [scrollbar-width:thin]"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

