import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 1. 지원하는 언어 목록 및 타입 정의
export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

// 2. 기본 언어
export const defaultLocale: Locale = 'en';

// 3. 유효한 언어인지 확인하는 함수
export function isValidLocale(locale: any): locale is Locale {
  return locales.includes(locale as Locale);
}

// 4. next-intl 설정 (정적 Export용)
// 매개변수로 들어오는 { locale }을 그대로 사용하세요.
// headers()나 getLocale()을 직접 호출하지 않는 것이 핵심입니다!
export default getRequestConfig(async ({ locale }) => {
  // 만약 locale이 유효하지 않은 경우 안전하게 처리
  if (!isValidLocale(locale)) {
    return notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    // 서버/클라이언트 환경 차이로 인한 마크업 불일치를 막기 위해 기본 timeZone 지정
    timeZone: 'Asia/Seoul',
    
    // 번역 문구가 없을 때 보여줄 기본 텍스트 설정
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter((part) => part != null).join('.');
      return `Translation missing: ${path}`;
    },
  };
});