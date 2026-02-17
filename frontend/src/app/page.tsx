'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 측에서 언어 감지 후 리다이렉트
    const detectAndRedirect = () => {
      // 1. localStorage에서 언어 확인
      const storedLocale = localStorage.getItem('user-lang');
      if (storedLocale === 'ko' || storedLocale === 'en') {
        router.replace(`/${storedLocale}`);
        return;
      }

      // 2. 브라우저 언어 확인
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ko')) {
        localStorage.setItem('user-lang', 'ko');
        router.replace('/ko');
        return;
      }

      // 3. 기본값 (영어)
      localStorage.setItem('user-lang', 'en');
      router.replace('/en');
    };

    detectAndRedirect();
  }, [router]);

  // 리다이렉트 중 로딩 표시
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-700 mb-2">Loading...</div>
        <div className="text-gray-500">Redirecting...</div>
      </div>
    </div>
  );
}
