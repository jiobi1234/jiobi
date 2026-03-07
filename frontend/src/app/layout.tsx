import type { Metadata } from 'next';
import './globals.css';
import '../styles/hk/common.css';

export const metadata: Metadata = {
  title: 'Jiobi.kr - 홈',
  description: 'Jiobi.kr에 오신걸 환영합니다',
  verification: {
    google: 'Wq_x7SLyfwix4NnQ0evvTZovgK0-7BRE0iFGzVIZ-n0',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
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
        {children}
        
        {/* Google AdSense: 프로덕션에서만 로드 */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6857449583126977"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}

