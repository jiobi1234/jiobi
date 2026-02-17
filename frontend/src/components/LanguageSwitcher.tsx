'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getStringParam } from '../utils/typeGuards';

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');
  const currentLocale = getStringParam(params, 'locale') || 'en';

  const switchLanguage = (newLocale: 'ko' | 'en') => {
    // 현재 경로에서 locale 부분을 새 locale로 교체
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    
    // localStorage에 언어 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-lang', newLocale);
    }
    
    // 새 경로로 이동
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('ko')}
        className={`px-3 py-1 rounded transition-colors ${
          currentLocale === 'ko'
            ? 'bg-[#007BFF] text-white'
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        title={t('switchToKorean')}
      >
        KO
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded transition-colors ${
          currentLocale === 'en'
            ? 'bg-[#007BFF] text-white'
            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
        }`}
        title={t('switchToEnglish')}
      >
        EN
      </button>
    </div>
  );
}

