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
    <nav className="flex items-center gap-6 text-sm text-slate-300">
      {navItems.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const isActive =
          pathname === fullHref ||
          (item.href !== '/hk' && pathname.startsWith(fullHref));

        const baseClass =
          'border-b-2 border-transparent pb-1 text-sm font-medium transition-colors';
        const activeClass = isActive
          ? 'text-sky-400 border-sky-400'
          : 'text-slate-300 hover:text-slate-50';

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={`${baseClass} ${activeClass}`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

