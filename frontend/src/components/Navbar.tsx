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
    <header className="bg-[#373e56] text-white py-4">
      <div className="max-w-6xl mx-auto px-4 flex items-center">
        {/* 로고 */}
        <div className="flex items-center">
          <Link href={`/${locale}`} className="text-2xl font-bold hover:text-[#007BFF] transition-colors">
            jiobi
          </Link>
        </div>
        
        {/* 네비게이션 (중앙) */}
        <nav className="flex items-center mx-auto" style={{ gap: '144px' }}>
          <Link href={`/${locale}/util`} className="hover:text-[#007BFF] transition-colors">{t('util')}</Link>
          <Link href={`/${locale}/games`} className="hover:text-[#007BFF] transition-colors">{t('games')}</Link>
          <Link href={`/${locale}/blog`} className="hover:text-[#007BFF] transition-colors">{t('blog')}</Link>
          <Link href={`/${locale}/hk`} className="hover:text-[#007BFF] transition-colors">{t('hk')}</Link>
        </nav>
        
        {/* 언어 전환 버튼 */}
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

