import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '../../i18n';
import type { Metadata } from 'next';
import Script from 'next/script';
import ErrorBoundaryWrapper from '../../components/common/ErrorBoundaryWrapper';
import IntlProvider from '../../components/common/IntlProvider';
import { ToastProvider } from '../../components/hk/common/Toast';
import '../globals.css';
import '../../styles/variables.css';
import '../../styles/hk/common.css';

export const dynamicParams = true;

export function generateStaticParams() {
  // 개발 환경에서도 실제 locale 배열 반환하여 Next.js가 경로를 올바르게 인식하도록 함
  // 프로덕션에서는 모든 locale에 대해 정적 생성
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }
  
  return {
    title: locale === 'ko' ? 'Jiobi.kr - 홈' : 'Jiobi.kr - Home',
    description: locale === 'ko' ? 'Jiobi.kr에 오신걸 환영합니다' : 'Welcome to Jiobi.kr',
    verification: {
      google: 'Wq_x7SLyfwix4NnQ0evvTZovgK0-7BRE0iFGzVIZ-n0',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // 메시지를 동적으로 import
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }

  return (
    <html lang={locale}>
      <head>
        {/* Tailwind CSS CDN */}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        
        {/* Google Fonts - Noto Sans KR */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#E9ECEF] min-h-screen text-[#495057] flex flex-col">
        <ErrorBoundaryWrapper messages={messages}>
          <IntlProvider locale={locale} messages={messages}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </IntlProvider>
        </ErrorBoundaryWrapper>
        
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6857449583126977"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

