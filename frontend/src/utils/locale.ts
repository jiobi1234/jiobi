import { locales, defaultLocale, isValidLocale, type Locale } from '../i18n';

/**
 * 클라이언트 측에서 언어 감지
 * 우선순위: localStorage > navigator.language > 기본값
 */
export function detectClientLocale(): Locale {
  // 1. localStorage에서 언어 확인
  if (typeof window !== 'undefined') {
    const storedLocale = localStorage.getItem('user-lang');
    if (storedLocale && isValidLocale(storedLocale)) {
      return storedLocale;
    }

    // 2. navigator.language에서 언어 확인
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      return 'ko';
    }
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  }

  // 3. 기본값 반환
  return defaultLocale;
}

/**
 * 현재 URL에서 locale 추출
 */
export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }
  
  return null;
}

/**
 * 언어를 localStorage에 저장
 */
export function saveLocaleToStorage(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-lang', locale);
  }
}

/**
 * 언어를 Cookie에 저장 (서버 측에서만 사용)
 */
export function saveLocaleToCookie(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.cookie = `user-lang=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
}

