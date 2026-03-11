'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../utils/typeGuards';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const params = useParams();
  const locale = getStringParam(params, 'locale') || 'en';
  const t = useTranslations('navigation');

  useEffect(() => {
    // 다크모드 상태 초기화 (localStorage에서 불러오기)
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
        {/* 로고 */}
        <div className="flex items-center">
          <Link
            href={`/${locale}`}
            className="text-2xl font-bold tracking-tight text-slate-900 transition-colors hover:text-sky-600"
          >
            jiobi
          </Link>
        </div>
        
        {/* 네비게이션 (중앙) */}
        <nav className="mx-auto flex items-center gap-10 text-sm font-medium text-slate-600">
          <Link
            href={`/${locale}/util`}
            className="transition-colors hover:text-sky-600"
          >
            {t('util')}
          </Link>
          <Link
            href={`/${locale}/games`}
            className="transition-colors hover:text-sky-600"
          >
            {t('games')}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="transition-colors hover:text-sky-600"
          >
            {t('blog')}
          </Link>
          <Link
            href={`/${locale}/hk`}
            className="transition-colors hover:text-sky-600"
          >
            {t('hk')}
          </Link>
        </nav>
        
        {/* 언어 전환 버튼 */}
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

