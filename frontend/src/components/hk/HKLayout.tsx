'use client';

import { ReactNode } from 'react';
import { usePathname, useParams } from 'next/navigation';
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
  const locale = params?.locale as string || 'ko';
  return (
    <ErrorBoundary>
      <HKProvider>
        <ToastProvider>
          {/* JIOBI 헤더 (흰색, 얇은 세로폭, 중앙정렬) */}
          <header className="jiobi-header">
            <div className="jiobi-header-content">
              <div className="jiobi-logo">
                <Link href={`/${locale}`} className="jiobi-logo-link">JIOBI</Link>
              </div>
              
              <nav className="jiobi-nav">
                <Link href={`/${locale}/util`} className="jiobi-nav-link">유틸</Link>
                <Link href={`/${locale}/blog`} className="jiobi-nav-link">블로그</Link>
                <Link href={`/${locale}/games/`} className="jiobi-nav-link">게임</Link>
                <Link href={`/${locale}/hk`} className="jiobi-nav-link">여행</Link>
              </nav>
              
              <div className="jiobi-spacer"></div>
            </div>
          </header>

          {/* HK 헤더 (검은색 #202123) */}
          <HKHeader />

          {/* 메인 컨텐츠 */}
          <main className="main-content">
            {children}
          </main>

          {/* 푸터 */}
          <HKFooter />

          <style jsx global>{`
        /* HK 앱 CSS 변수 */
        :root {
          --hk-primary: #0066FF;
          --hk-primary-hover: #0056E6;
          --hk-primary-light: rgba(0, 102, 255, 0.1);
          --hk-primary-dark: #0047B3;
          --hk-text-primary: #333333;
          --hk-text-secondary: #666666;
          --hk-text-tertiary: #999999;
          --hk-bg-primary: #FFFFFF;
          --hk-bg-secondary: #F8F9FA;
          --hk-bg-tertiary: #E9ECEF;
          --hk-border-primary: #E9ECEF;
          --hk-border-secondary: #DEE2E6;
          --hk-error: #DC3545;
          --hk-error-light: #FFF5F5;
          --hk-error-border: #FED7D7;
          --hk-success: #28A745;
          --hk-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --hk-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
          --hk-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
          --hk-shadow-primary: 0 4px 8px rgba(0, 102, 255, 0.3);
          --hk-spacing-xs: 4px;
          --hk-spacing-sm: 8px;
          --hk-spacing-md: 16px;
          --hk-spacing-lg: 24px;
          --hk-spacing-xl: 32px;
          --hk-radius-sm: 8px;
          --hk-radius-md: 12px;
          --hk-radius-lg: 20px;
          --hk-radius-xl: 25px;
          --hk-transition: all 0.3s ease;
        }
        
        /* 기본 스타일 */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }

        /* JIOBI 헤더 스타일 (흰색, 얇은 세로폭) */
        .jiobi-header {
          background-color: white;
          border-bottom: 1px solid #e9ecef;
          height: 50px;
          display: flex;
          align-items: center;
        }

        .jiobi-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          position: relative;
        }

        .jiobi-logo-link {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .jiobi-logo-link:hover {
          color: #007BFF;
        }

        .jiobi-nav {
          display: flex;
          gap: 60px;
          align-items: center;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .jiobi-spacer {
          width: 100px;
        }

        .jiobi-nav-link {
          color: #000;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .jiobi-nav-link:hover {
          color: #007BFF;
        }

        .main-content {
          min-height: calc(100vh - 200px);
          padding: 20px 0;
        }

        /* 유틸리티 클래스 */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .text-center {
          text-align: center;
        }

        .text-left {
          text-align: left;
        }

        .text-right {
          text-align: right;
        }

        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 3rem; }

        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        .mt-5 { margin-top: 3rem; }

        .p-1 { padding: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 1rem; }
        .p-4 { padding: 1.5rem; }
        .p-5 { padding: 3rem; }

        .d-none { display: none; }
        .d-block { display: block; }
        .d-flex { display: flex; }
        .d-grid { display: grid; }

        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-around { justify-content: space-around; }

        .align-center { align-items: center; }
        .align-start { align-items: flex-start; }
        .align-end { align-items: flex-end; }

        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 1rem; }
        .gap-4 { gap: 1.5rem; }
        .gap-5 { gap: 3rem; }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .jiobi-nav {
            gap: 20px;
          }
          
          .main-content {
            padding: 10px 0;
          }
        }

        @media (max-width: 480px) {
          .jiobi-header-content {
            padding: 0 15px;
          }
          
          .jiobi-nav {
            gap: 15px;
          }
        }
      `}</style>
        </ToastProvider>
      </HKProvider>
    </ErrorBoundary>
  );
}

