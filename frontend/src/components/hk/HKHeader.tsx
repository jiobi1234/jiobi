'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HKNav from './common/HKNav';
import HKSearchBar from './common/HKSearchBar';
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
    <>
      <header className="hk-header">
        <div className="hk-header-content">
          {/* 로고 */}
          <div className="hk-logo">
            <Link href={`/${locale}/hk`} className="hk-logo-link">JIOBI</Link>
          </div>
          
          {/* 네비게이션 */}
          <HKNav />
          
          {/* 검색바 */}
          <div className="hk-search">
            <HKSearchBar />
          </div>
          
          {/* 인증 영역 */}
          {isAuthenticated ? (
            <div className="hk-auth-area">
              {isAdmin && (
                <Link href={`/${locale}/hk/admin`} className="admin-link">
                  {t('admin')}
                </Link>
              )}
              <Link href={`/${locale}/hk/wishlist`} className="wishlist-link">
                {tCommon('wishlist')}
              </Link>
              <Link href={`/${locale}/hk/mypage`} className="hk-profile">
                <div className="profile-picture">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="profile-icon">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
                    <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="white"/>
                  </svg>
                </div>
                <span className="profile-name">{username || t('user')} {locale === 'ko' ? '님' : ''}</span>
              </Link>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link href={`/${locale}/hk/login`} className="auth-link">
                <HKButton
                  variant="outline"
                  size="sm"
                  className="auth-button--login"
                >
                  {tCommon('login')}
                </HKButton>
              </Link>
              <Link href={`/${locale}/hk/signup`} className="auth-link">
                <HKButton
                  variant="solid"
                  size="sm"
                  className="auth-button--signup"
                >
                  {tCommon('signup')}
                </HKButton>
              </Link>
            </div>
          )}
        </div>
      </header>

      <style jsx>{`
        /* HK 헤더 스타일 (검은색 #202123) */
        .hk-header {
          background-color: #202123;
          height: 70px;
          display: flex;
          align-items: center;
        }

        .hk-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 20px;
        }

        /* 로고 스타일 */
        .hk-logo-link {
          font-size: 24px;
          font-weight: bold;
          color: white;
          text-decoration: none;
          transition: var(--hk-transition);
        }

        .hk-logo-link:hover {
          color: var(--hk-primary);
        }

        /* 검색 영역 */
        .hk-search {
          flex: 1;
          max-width: 500px;
          margin: 0 30px;
        }

        /* 사용자 프로필 스타일 */
        .hk-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: var(--hk-transition);
          padding: 5px;
          border-radius: var(--hk-radius-sm);
        }

        .hk-profile:hover {
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.1);
        }

        .profile-picture {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-icon {
          width: 24px;
          height: 24px;
          fill: white;
        }

        .profile-name {
          color: white;
          font-weight: 500;
        }

        /* 인증 영역 스타일 */
        .hk-auth-area {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .admin-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--hk-radius-sm);
          background: rgba(255, 255, 255, 0.1);
          transition: var(--hk-transition);
        }

        .admin-link:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--hk-primary);
        }

        .wishlist-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: var(--hk-radius-sm);
          transition: var(--hk-transition);
        }

        .wishlist-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--hk-primary);
        }

        /* 인증 버튼 스타일 */
        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-link {
          text-decoration: none;
        }

        .auth-button--login {
          color: white !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          background: transparent !important;
        }

        .auth-button--login:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }

        .auth-button--signup {
          background: white !important;
          color: #202123 !important;
          border-color: white !important;
        }

        .auth-button--signup:hover {
          background: var(--hk-bg-secondary) !important;
          border-color: var(--hk-border-primary) !important;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .hk-search {
            margin: 0 15px;
          }
        }

        @media (max-width: 480px) {
          .hk-header-content {
            padding: 0 15px;
          }
          
          .hk-search {
            display: none;
          }
          
          .profile-name {
            display: none;
          }
          
          .auth-buttons {
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
}

