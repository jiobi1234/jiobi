'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function HKFooter() {
  const params = useParams();
  const locale = params?.locale as string || 'ko';

  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-50 text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* 왼쪽: 로고 및 회사 정보 */}
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold tracking-tight text-slate-900">
            JIOBI
          </div>
          <div className="text-xs text-slate-500">회사정보</div>
        </div>

        {/* 오른쪽: 링크, 언어 선택, 소셜 */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-3 text-xs">
              <Link
                href="#"
                className="text-slate-500 transition-colors hover:text-slate-900"
              >
                이용 약관
              </Link>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <Link
                href={`/${locale}/hk/privacy`}
                className="text-slate-500 transition-colors hover:text-slate-900"
              >
                개인정보처리방침
              </Link>
              <span className="hidden text-slate-300 sm:inline">|</span>
              <Link
                href={`/${locale}/hk/contact`}
                className="text-slate-500 transition-colors hover:text-slate-900"
              >
                고객센터
              </Link>
            </div>
            <div className="relative">
              <select className="h-9 rounded-full border border-slate-300 bg-white px-4 pr-8 text-xs text-slate-700 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20">
                <option value="ko">한국어</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877f2] text-white shadow-sm shadow-slate-300/70 transition hover:opacity-80"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Link>
            <Link
              href="#"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-sm shadow-slate-300/70 transition hover:opacity-80"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.059 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

