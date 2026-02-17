const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 개발 환경에서는 정적 export 비활성화 (동적 라우트 사용 가능)
  // 프로덕션 빌드 시에만 정적 export 사용
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  trailingSlash: false,
  // 개발 모드에서 동적 라우팅 안정화를 위한 설정
  ...(process.env.NODE_ENV === 'development' ? {
    // 개발 모드에서 번들 경로 인코딩 문제 방지
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // 클라이언트 번들에서 동적 라우트 경로 처리 개선
        config.optimization = {
          ...config.optimization,
          moduleIds: 'named',
        };
      }
      return config;
    },
  } : {}),
  env: {
    // 백엔드 API URL (개발/프로덕션 환경 자동 분리)
    // config.ts에서 process.env.NEXT_PUBLIC_API_BASE_URL로 사용됨
    // 프로덕션: 포트 없이 사용 (가비아 Reverse Proxy가 /api/...를 백엔드로 프록시)
    // HTTPS는 나중에 추가 예정, 현재는 HTTP 사용
    NEXT_PUBLIC_API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'http://jiobi.kr' 
      : 'http://localhost:8000',
    _next_intl_trailing_slash: 'never',
  },
  // 정적 export에서는 rewrites를 사용할 수 없음
  // API 호출은 클라이언트에서 직접 백엔드로 요청
  //
  // [배포] 모든 카카오 장소 id 접근을 위해 fallback 필요:
  // - Vercel: vercel.json rewrites 사용 (/:locale/hk/place/kakao/:id → /:locale)
  // - Nginx: location ~ ^/(ko|en)/hk/place/kakao/ { try_files $uri $uri/ /$1/index.html; }
  // - Apache: RewriteRule ^(ko|en)/hk/place/kakao/.+ $1/index.html [L]
}

module.exports = withNextIntl(nextConfig)

