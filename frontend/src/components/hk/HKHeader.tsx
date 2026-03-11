'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKNav from './common/HKNav';
import HKButton from './common/HKButton';
import apiClient from '../../lib/api-client';

export default function HKHeader() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'ko';
  const t = useTranslations('hk.header');
  const tCommon = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = apiClient.auth.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        try {
          const user = await apiClient.auth.getCurrentUser();
          setUsername(user?.username ?? null);
          // 백엔드 .env 에 ADMIN_EMAIL 이 설정되고, 로그인한 계정 이메일과 일치해야 is_admin 이 true 로 옵니다.
          setIsAdmin(Boolean(user?.is_admin));
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          setUsername(null);
          setIsAdmin(false);
        }
      } else {
        setUsername(null);
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, [pathname]);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-18 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link
          href={`/${locale}/hk`}
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          JIOBI
        </Link>

        {/* 네비게이션 (검색바 제거, 중앙 여백 유지) */}
        <div className="hidden flex-1 items-center md:flex md:gap-8">
          <HKNav />
        </div>

        {/* 인증 영역 */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href={`/${locale}/hk/admin`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-sky-500 hover:text-sky-700"
              >
                {t('admin')}
              </Link>
            )}
            <Link
              href={`/${locale}/hk/wishlist`}
              className="text-xs font-medium text-slate-600 hover:text-sky-600"
            >
              {tCommon('wishlist')}
            </Link>
            <Link
              href={`/${locale}/hk/mypage`}
              className="flex items-center gap-2 rounded-full px-1.5 py-1 text-xs text-slate-900 hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sm shadow-sky-500/40">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="hidden text-xs font-medium sm:inline">
                {username || t('user')}
                {locale === 'ko' ? ' 님' : ''}
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={`/${locale}/hk/login`}>
              <HKButton
                variant="outline"
                size="sm"
                className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              >
                {tCommon('login')}
              </HKButton>
            </Link>
            <Link href={`/${locale}/hk/signup`}>
              <HKButton
                variant="solid"
                size="sm"
                className="border-sky-500 bg-sky-500 text-white hover:bg-sky-600"
              >
                {tCommon('signup')}
              </HKButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

