import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './src/i18n';

// Next.js 동적 세그먼트([locale]) 청크 경로 이중 인코딩 시 404 방지 (Windows/일부 환경)
function fixStaticChunkEncoding(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/_next/static/')) return null;
  // %255B/%255D(이중 인코딩) -> %5B/%5D(단일 인코딩)로 복원
  const hasDoubleEncoded = pathname.includes('%255B') || pathname.includes('%255D');
  if (!hasDoubleEncoded) return null;
  const decodedPathname = pathname
    .replace(/%255B/gi, '%5B')
    .replace(/%255D/gi, '%5D');
  const url = request.nextUrl.clone();
  url.pathname = decodedPathname;
  return NextResponse.rewrite(url);
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  const staticFix = fixStaticChunkEncoding(request);
  if (staticFix) return staticFix;
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|api|static|.*\\..*).*)',
    // _next/static 청크 요청도 처리(이중 인코딩 수정용)
    '/_next/static/:path*',
  ]
};

