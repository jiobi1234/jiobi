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
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-0.5 shadow-sm">
      <button
        onClick={() => switchLanguage('ko')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          currentLocale === 'ko'
            ? 'bg-sky-500 text-white shadow-sm'
            : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
        title={t('switchToKorean')}
      >
        KO
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          currentLocale === 'en'
            ? 'bg-sky-500 text-white shadow-sm'
            : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
        title={t('switchToEnglish')}
      >
        EN
      </button>
    </div>
  );
}

