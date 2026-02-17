# 다국어 시스템 구현 계획서

## 📋 프로젝트 개요
- **목표**: jiobi.kr에 한국어(ko)와 영어(en) 다국어 지원 추가
- **기술 스택**: Next.js 14 (App Router) + FastAPI
- **라이브러리**: next-intl

---

## 🎯 구현 목표

### 1. URL 구조
- 모든 페이지를 `/[locale]/...` 구조로 변경
- 예: `/ko/hk`, `/en/hk`, `/ko/games`, `/en/games`

### 2. 언어 감지 우선순위
1. **URL 경로** (`/ko/...`, `/en/...`)
2. **Cookie/로컬스토리지** (`user-lang` 값)
3. **브라우저 헤더** (`Accept-Language` 또는 `navigator.language`)
4. **기본값**: 영어(`en`)

### 3. 루트 경로 처리
- `jiobi.kr/` 접속 시 언어 감지 후 자동 리다이렉트
- `jiobi.kr/` → `jiobi.kr/ko/` 또는 `jiobi.kr/en/`

### 4. API 통신
- Next.js에서 결정된 언어 코드를 API 호출 시 헤더에 포함
- 헤더명: `Accept-Language: ko` 또는 `Accept-Language: en`

### 5. 언어 전환
- 사용자가 [KO | EN] 버튼 클릭 시:
  1. localStorage에 즉시 저장
  2. URL을 `/ko` 또는 `/en`으로 변경
  3. 페이지 리로드 또는 클라이언트 네비게이션

### 6. SEO 대응
- next-intl을 사용하여 검색 로봇이 언어별 페이지를 각각 수집 가능
- 각 언어별로 별도의 URL 제공 (`/ko/...`, `/en/...`)

---

## 📁 파일 구조 변경 계획

### 현재 구조
```
frontend/src/app/
├── page.tsx          # 홈
├── layout.tsx        # 루트 레이아웃
├── hk/               # HK 앱
├── games/            # 게임
├── util/             # 유틸리티
└── blog/             # 블로그
```

### 변경 후 구조
```
frontend/src/app/
├── page.tsx          # 루트 (리다이렉트용)
├── layout.tsx        # 루트 레이아웃 (리다이렉트 로직)
├── [locale]/         # 동적 라우팅
│   ├── layout.tsx    # 언어별 레이아웃
│   ├── page.tsx      # 홈
│   ├── hk/           # HK 앱
│   ├── games/        # 게임
│   ├── util/         # 유틸리티
│   └── blog/         # 블로그
└── messages/         # 번역 파일
    ├── ko.json
    └── en.json
```

---

## 🔧 구현 단계

### Phase 1: 환경 설정
- [ ] `next-intl` 라이브러리 설치
- [ ] `next.config.js` 설정 업데이트
- [ ] 번역 파일 디렉토리 생성 (`messages/ko.json`, `messages/en.json`)

### Phase 2: 라우팅 구조 변경
- [ ] `[locale]` 동적 라우팅 디렉토리 생성
- [ ] 기존 페이지들을 `[locale]` 하위로 이동
  - [ ] `app/hk/` → `app/[locale]/hk/`
  - [ ] `app/games/` → `app/[locale]/games/`
  - [ ] `app/util/` → `app/[locale]/util/`
  - [ ] `app/blog/` → `app/[locale]/blog/`
- [ ] 루트 `page.tsx`를 리다이렉트 로직으로 변경
- [ ] `[locale]/layout.tsx` 생성 (next-intl 설정)

### Phase 3: 언어 감지 및 리다이렉트
- [ ] 언어 감지 유틸리티 함수 생성
  - [ ] URL에서 언어 추출
  - [ ] Cookie/로컬스토리지에서 언어 읽기
  - [ ] 브라우저 헤더에서 언어 감지
- [ ] 루트 레이아웃에 자동 리다이렉트 로직 추가
- [ ] 미들웨어 생성 (Next.js middleware.ts)

### Phase 4: API 클라이언트 수정
- [ ] `base-client.ts`의 `getHeaders()` 메서드에 언어 헤더 추가
- [ ] 현재 언어를 가져오는 유틸리티 함수 생성
- [ ] 모든 API 호출에 `Accept-Language` 헤더 포함

### Phase 5: FastAPI 백엔드 수정
- [ ] 언어 헤더를 읽는 미들웨어 추가
- [ ] 에러 메시지 다국어화
  - [ ] 에러 메시지 번역 파일 생성
  - [ ] HTTPException 메시지 다국어화
- [ ] 언어별 응답 메시지 처리

### Phase 6: 번역 파일 작성
- [ ] 공통 번역 (네비게이션, 버튼 등)
- [ ] HK 앱 번역
- [ ] 게임 앱 번역
- [ ] 유틸리티 앱 번역
- [ ] 블로그 번역
- [ ] 에러 메시지 번역

### Phase 7: 언어 전환 기능
- [ ] 언어 전환 버튼 컴포넌트 생성
- [ ] 언어 전환 로직 구현
  - [ ] localStorage 저장
  - [ ] URL 변경
  - [ ] 페이지 리로드 또는 네비게이션
- [ ] 헤더/푸터에 언어 전환 버튼 추가

### Phase 8: 메타데이터 다국어화
- [ ] 각 페이지의 메타데이터를 번역 파일에서 가져오도록 수정
- [ ] `layout.tsx`의 메타데이터 다국어화
- [ ] 동적 메타데이터 생성 함수 작성

### Phase 9: 테스트 및 검증
- [ ] 언어 감지 우선순위 테스트
- [ ] 리다이렉트 동작 테스트
- [ ] API 헤더 전달 테스트
- [ ] 언어 전환 버튼 동작 테스트
- [ ] SEO 메타데이터 확인

---

## 📝 상세 작업 내용

### 1. next-intl 설정

#### 설치
```bash
npm install next-intl
```

#### next.config.js
```javascript
const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl({
  // 기존 설정
});
```

#### i18n.ts (설정 파일)
```typescript
export const locales = ['ko', 'en'] as const;
export const defaultLocale = 'en' as const;
```

### 2. 미들웨어 (middleware.ts)
- URL에서 언어 추출
- 언어가 없으면 감지 후 리다이렉트
- Cookie 설정

### 3. API 클라이언트 수정
- `getCurrentLanguage()` 함수 추가
- `getHeaders()`에 `Accept-Language` 헤더 추가

### 4. FastAPI 미들웨어
```python
@app.middleware("http")
async def add_language_header(request: Request, call_next):
    lang = request.headers.get("Accept-Language", "en")
    request.state.language = lang
    response = await call_next(request)
    return response
```

### 5. 번역 파일 구조
```json
// messages/ko.json
{
  "common": {
    "home": "홈",
    "login": "로그인",
    "signup": "회원가입"
  },
  "hk": {
    "title": "HK 여행 앱",
    "search": "검색"
  },
  "errors": {
    "notFound": "찾을 수 없습니다",
    "invalidCredentials": "이메일 또는 비밀번호가 올바르지 않습니다"
  }
}
```

---

## 🎨 영향받는 파일 목록

### 프론트엔드
- `frontend/next.config.js` - next-intl 설정 추가
- `frontend/src/app/layout.tsx` - 리다이렉트 로직
- `frontend/src/app/page.tsx` - 리다이렉트로 변경
- `frontend/src/app/[locale]/layout.tsx` - 새로 생성
- `frontend/src/app/[locale]/page.tsx` - 기존 page.tsx 이동
- `frontend/src/app/[locale]/hk/**` - 모든 HK 페이지 이동
- `frontend/src/app/[locale]/games/**` - 모든 게임 페이지 이동
- `frontend/src/app/[locale]/util/**` - 모든 유틸리티 페이지 이동
- `frontend/src/app/[locale]/blog/**` - 블로그 페이지 이동
- `frontend/src/lib/api-client/base-client.ts` - 언어 헤더 추가
- `frontend/src/components/Navbar.tsx` - 언어 전환 버튼 추가
- `frontend/src/components/hk/HKHeader.tsx` - 언어 전환 버튼 추가
- `frontend/middleware.ts` - 새로 생성 (언어 감지 및 리다이렉트)

### 백엔드
- `backend/app/main.py` - 언어 미들웨어 추가
- `backend/app/api/auth.py` - 에러 메시지 다국어화
- `backend/app/api/hk.py` - 에러 메시지 다국어화
- `backend/app/api/util.py` - 에러 메시지 다국어화
- `backend/app/api/blog.py` - 에러 메시지 다국어화
- `backend/app/core/i18n.py` - 새로 생성 (번역 유틸리티)

### 새로 생성할 파일
- `frontend/messages/ko.json` - 한국어 번역
- `frontend/messages/en.json` - 영어 번역
- `frontend/src/i18n.ts` - next-intl 설정
- `frontend/middleware.ts` - Next.js 미들웨어
- `backend/app/core/i18n.py` - FastAPI 번역 유틸리티
- `backend/messages/ko.json` - 백엔드 한국어 메시지
- `backend/messages/en.json` - 백엔드 영어 메시지

---

## ⚠️ 주의사항

1. **기존 링크/북마크**: 모든 URL이 변경되므로 기존 링크는 작동하지 않음
   - 해결: 루트에서 자동 리다이렉트로 처리

2. **SSR/SSG**: next-intl은 SSR/SSG를 지원하지만 설정 필요

3. **타입 안정성**: TypeScript 타입 정의 필요

4. **외부 API**: TourAPI, KakaoAPI 등은 한국어로 유지 (변경 없음)

5. **데이터베이스**: 저장된 데이터는 언어별 필드 불필요 (외부 API 데이터 사용)

---

## 📊 진행 상황 체크리스트

### 환경 설정
- [ ] next-intl 설치
- [ ] next.config.js 설정
- [ ] 번역 파일 디렉토리 생성

### 라우팅 구조
- [ ] [locale] 디렉토리 생성
- [ ] 페이지 이동 완료
- [ ] 레이아웃 설정

### 언어 감지
- [ ] 미들웨어 구현
- [ ] 리다이렉트 로직
- [ ] Cookie/로컬스토리지 처리

### API 통신
- [ ] 프론트엔드 헤더 추가
- [ ] 백엔드 미들웨어 추가
- [ ] 에러 메시지 다국어화

### 번역
- [ ] 번역 파일 작성
- [ ] 컴포넌트에 번역 적용
- [ ] 메타데이터 다국어화

### 언어 전환
- [ ] 전환 버튼 구현
- [ ] 전환 로직 구현
- [ ] UI에 버튼 추가

### 테스트
- [ ] 언어 감지 테스트
- [ ] 리다이렉트 테스트
- [ ] API 통신 테스트
- [ ] 언어 전환 테스트

---

## 🚀 시작하기

1. **Phase 1부터 순차적으로 진행**
2. **각 Phase 완료 후 테스트**
3. **문제 발생 시 즉시 중단하고 확인**

---

**작성일**: 2024년
**최종 수정일**: 2024년

