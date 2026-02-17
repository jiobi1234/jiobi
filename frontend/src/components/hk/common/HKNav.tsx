'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface NavItem {
  href: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: '/hk', labelKey: 'mainPage' },
  { href: '/hk/travel/stories', labelKey: 'travelStories' },
  { href: '/hk/mytravel', labelKey: 'myTravel' },
];

/**
 * HK 앱 전용 네비게이션 컴포넌트
 * 현재 경로에 따라 활성 상태를 표시
 */
export default function HKNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string || 'ko';
  const t = useTranslations('hk.header');

  return (
    <>
      <nav className="hk-nav">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname === fullHref || 
            (item.href !== '/hk' && pathname.startsWith(fullHref));
          
          return (
            <Link 
              key={item.href}
              href={fullHref} 
              className={`hk-nav-link ${isActive ? 'active' : ''}`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .hk-nav {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .hk-nav-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: var(--hk-transition);
          position: relative;
        }

        .hk-nav-link:hover {
          color: var(--hk-primary);
        }

        .hk-nav-link.active {
          color: var(--hk-primary);
        }

        .hk-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--hk-primary);
        }

        @media (max-width: 768px) {
          .hk-nav {
            gap: 20px;
          }
        }

        @media (max-width: 480px) {
          .hk-nav {
            gap: 15px;
          }
        }
      `}</style>
    </>
  );
}

