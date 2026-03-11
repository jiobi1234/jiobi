'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import HKHeader from './HKHeader';
import HKFooter from './HKFooter';
import ErrorBoundary from './ErrorBoundary';
import { HKProvider } from '../../contexts/HKContext';
import { ToastProvider } from './common/Toast';

interface HKLayoutProps {
  children: ReactNode;
}

export default function HKLayout({ children }: HKLayoutProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'ko';
  return (
    <ErrorBoundary>
      <HKProvider>
        <ToastProvider>
          <div className="min-h-screen bg-white text-slate-900 flex flex-col">
            {/* 상단 JIOBI 글로벌 헤더 (유틸/메인과 톤 통일) */}
            <header className="border-b border-slate-200 bg-white">
              <div className="mx-auto flex h-12 max-w-6xl items-center justify-center gap-8 px-4 sm:h-14 sm:px-6 lg:px-8">
                <Link
                  href={`/${locale}`}
                  className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base"
                >
                  JIOBI
                </Link>
                <nav className="hidden items-center gap-6 text-xs font-medium text-slate-600 sm:flex sm:text-sm">
                  <Link
                    href={`/${locale}/util`}
                    className="transition-colors hover:text-sky-600"
                  >
                    유틸
                  </Link>
                  <Link
                    href={`/${locale}/blog`}
                    className="transition-colors hover:text-sky-600"
                  >
                    블로그
                  </Link>
                  <Link
                    href={`/${locale}/games/`}
                    className="transition-colors hover:text-sky-600"
                  >
                    게임
                  </Link>
                  <Link
                    href={`/${locale}/hk`}
                    className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-sky-200/80 ring-1 ring-sky-500/80 hover:bg-sky-600"
                  >
                    여행
                  </Link>
                </nav>
              </div>
            </header>

            {/* HK 헤더 */}
            <HKHeader />

            {/* 메인 컨텐츠 */}
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-10">
                {children}
              </div>
            </main>

            {/* 푸터 */}
            <HKFooter />
          </div>
        </ToastProvider>
      </HKProvider>
    </ErrorBoundary>
  );
}

