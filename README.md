# Jiobi 프로젝트 구조 문서

## 📁 전체 구조

```
jiobisite/
├── backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/      # API 라우터
│   │   ├── core/     # 핵심 설정 및 유틸리티
│   │   ├── models/   # 데이터 모델
│   │   ├── services/ # 비즈니스 로직
│   │   └── main.py   # FastAPI 엔트리포인트
│   ├── requirements.txt
│   ├── env.example
│   └── venv/         # Python 가상환경
│
└── frontend/         # Next.js 프론트엔드
    ├── src/
    │   ├── app/      # Next.js App Router 페이지
    │   ├── components/ # React 컴포넌트
    │   ├── lib/      # 유틸리티 함수 및 API 클라이언트
    │   ├── contexts/ # React Context (전역 상태 관리)
    │   └── styles/   # CSS 스타일
    ├── public/       # 정적 파일
    └── package.json
```

---

## 🔧 Backend 구조 (FastAPI)

### `/backend/app/main.py`
- FastAPI 애플리케이션 엔트리포인트
- CORS 설정 (localhost:3000 허용)
- API 라우터 등록:
  - `/api/v1/hk` - HK 앱 (여행 관련)
  - `/api/v1/auth` - 인증
  - `/api/v1/util` - 유틸리티
  - `/api/v1/blog` - 블로그

### `/backend/app/api/` - API 라우터

#### **hk.py** - HK 앱 전용 API
- `GET /refresh-section/` - 섹션 데이터 새로고침 (카테고리별 장소 조회)
- `GET /search` - 장소 검색
- `GET /place/{place_id}` - 장소 상세 정보 조회
- `GET /theme/{theme_name}` - 테마별 장소 조회
- `POST /plan` - 여행 계획 생성
- `GET /plan/{plan_id}` - 여행 계획 조회
- `GET /plans` - 사용자 여행 계획 목록

#### **auth.py** - 인증 API
- `POST /login` - 로그인
- `POST /signup` - 회원가입
- JWT 토큰 관리

#### **util.py** - 유틸리티 API
- `GET /exchange-rate/` - 환율 조회
- `GET /holidays/` - 공휴일 조회
- `GET /lunar/` - 음력 변환
- `GET /ip/` - IP 주소 조회

#### **blog.py** - 블로그 API
- `GET /info` - 블로그 정보
- `GET /posts` - 블로그 포스트 목록
- Tistory 블로그 크롤링

#### 외부 API 클라이언트
- **tour_api.py** - TourAPI 클라이언트 (서비스에서 사용)
- **kakao_api.py** - Kakao API 클라이언트
- **google_maps_api.py** - Google Maps API 클라이언트

### `/backend/app/core/` - 핵심 설정
- **config.py** - 환경 변수 설정 (Pydantic Settings)
- **mongodb.py** - MongoDB 연결 관리
- **utils.py** - 공통 유틸리티 함수
- **api_client.py** - API 클라이언트 유틸리티

### `/backend/app/services/` - 비즈니스 로직
- **tour_service.py** - 여행 서비스 로직
  - 장소 검색, 여행 계획 생성/조회
  - TourAPI, Kakao API, Google Maps API 통합
- **place_service.py** - 장소 관련 서비스
- **tistory_crawler.py** - Tistory 블로그 크롤러

### `/backend/app/models/` - 데이터 모델
- **util_models.py** - 유틸리티 관련 Pydantic 모델

### 주요 의존성 (`requirements.txt`)
- `fastapi` - FastAPI 프레임워크
- `uvicorn` - ASGI 서버
- `pydantic` - 데이터 검증
- `pymongo` - MongoDB 드라이버
- `requests` - HTTP 클라이언트
- `beautifulsoup4` - HTML 파싱
- `email-validator` - 이메일 검증
- `python-dotenv` - 환경 변수 관리
- `python-jose` - JWT 토큰 처리
- `bcrypt` - 비밀번호 해싱

---

## 🎨 Frontend 구조 (Next.js)

### `/frontend/src/app/` - Next.js App Router

#### 메인 페이지
- **page.tsx** - 홈페이지 (메인 랜딩 페이지)
- **layout.tsx** - 전역 레이아웃
- **globals.css** - 전역 CSS

#### HK 앱 (여행 앱) - 구조 재설계 완료 ✅

**메인 페이지**
- **hk/page.tsx** - HK 메인 페이지
  - 컴포넌트 조립만 담당하는 깔끔한 구조
  - HeroSection, ThemesSection, HotTravelSection 조합

**인증 페이지**
- **hk/login/page.tsx** - 로그인
- **hk/signup/page.tsx** - 회원가입

**여행 계획**
- **hk/plan/select/page.tsx** - 여행 계획 선택
- **hk/plan/create/page.tsx** - 여행 계획 생성

**장소 관련**
- **hk/[id]/page.tsx** - 장소 상세 페이지 (동적 라우팅)
- **hk/search/page.tsx** - 장소 검색 페이지
- **hk/theme/[themeName]/page.tsx** - 테마별 장소 조회 (동적 라우팅)

**기타 페이지**
- **hk/mytravel/page.tsx** - 내 여행
- **hk/travel/stories/page.tsx** - 여행 스토리
- **hk/contact/page.tsx** - 문의
- **hk/privacy/page.tsx** - 개인정보처리방침
- **hk/guide/transport/page.tsx** - 교통 가이드
- **hk/guide/payment/page.tsx** - 결제 가이드

**문서**
- **hk/API_MAPPING.md** - API 매핑 문서 (각 페이지와 백엔드 API 연결 정보)

#### 유틸리티 페이지
- **util/page.tsx** - 유틸리티 메인
- **util/calculator/page.tsx** - 계산기
- **util/calendar/page.tsx** - 달력 (공휴일, 음력)
- **util/exchange-rate/page.tsx** - 환율 계산기
- **util/heartrate/page.tsx** - 심박수 계산기
- **util/bmi-calculator/page.tsx** - BMI 계산기
- **util/doryang/page.tsx** - 단위 변환기
- **util/breathing/page.tsx** - 명상 호흡
- **util/myip/page.tsx** - 내 IP 주소
- **util/clock/page.tsx** - 시계 (알람, 타이머, 스톱워치)

#### 게임 페이지
- **games/page.tsx** - 게임 메인
- **games/flashtrack/page.tsx** - FlashTrack 게임
- **games/locationmemory/page.tsx** - Location Memory 게임
- **games/numbersequence/page.tsx** - Number Sequence 게임
- **games/oxquiz/page.tsx** - OX Quiz 게임
- **games/stackdrop/page.tsx** - Stack Drop 게임
- **games/reactiontime/page.tsx** - Reaction Time 게임
- **games/memorytest/page.tsx** - Memory Test 게임

#### 블로그
- **blog/page.tsx** - 블로그 포스트 목록

### `/frontend/src/components/` - React 컴포넌트

#### 공통 컴포넌트
- **Navbar.tsx** - 메인 네비게이션 바
- **Footer.tsx** - 푸터

#### HK 앱 컴포넌트 (모듈화 완료 ✅)

**레이아웃 컴포넌트**
- **hk/HKHeader.tsx** - HK 앱 전용 헤더 (검색, 지역 선택)
- **hk/HKFooter.tsx** - HK 앱 전용 푸터
- **hk/HKLayout.tsx** - HK 앱 레이아웃 (Header + Footer + HKProvider)

**페이지 섹션 컴포넌트**
- **hk/HeroSection.tsx** - 히어로 섹션 (메인 배너)
- **hk/ThemesSection.tsx** - 맞춤 여행 테마 섹션
- **hk/HotTravelSection.tsx** - 핫한 여행 섹션 (카테고리별 장소 목록)

**카드 컴포넌트**
- **hk/ThemeCard.tsx** - 테마 카드 (재사용 가능)
- **hk/PlaceCard.tsx** - 여행 장소 카드 (재사용 가능)

**UI 컴포넌트**
- **hk/CategoryFilter.tsx** - 카테고리 필터 드롭다운
- **hk/LoadingState.tsx** - 로딩 상태 표시
- **hk/ErrorState.tsx** - 에러 상태 표시

**Custom Hooks**
- **hk/hooks/useTravelData.ts** - 여행 데이터 로딩 로직
  - 카테고리별 장소 데이터 로딩
  - 로딩/에러 상태 관리
  - 재시도 기능
- **hk/hooks/useHorizontalScroll.ts** - 가로 스크롤 기능
  - 마우스 휠로 가로 스크롤 지원

### `/frontend/src/contexts/` - 전역 상태 관리

- **HKContext.tsx** - HK 앱 전역 상태 관리
  - `selectedCategory` - 선택된 카테고리 (tourist, event, accommodation, restaurant)
  - `searchKeyword` - 검색 키워드
  - `navigationHistory` - 네비게이션 히스토리 (이전 페이지 상태 복원용)
  - `HKProvider` - Context Provider
  - `useHKContext` - Context Hook

### `/frontend/src/lib/` - 유틸리티 및 API 클라이언트

#### API 클라이언트 (`api-client/`)
- **index.ts** - API 클라이언트 메인 진입점
- **base-client.ts** - 기본 API 클라이언트 (에러 처리, 인증 등)
- **config.ts** - API 설정
- **types.ts** - TypeScript 타입 정의
- **auth-client.ts** - 인증 API 클라이언트
- **hk-client.ts** - HK 앱 API 클라이언트
- **util-client.ts** - 유틸리티 API 클라이언트
- **blog-client.ts** - 블로그 API 클라이언트

### `/frontend/src/styles/` - CSS 스타일
- **base.css** - 기본 스타일
- **blog/blog.css** - 블로그 스타일
- **games/** - 게임별 CSS 파일
- **hk/main.css** - HK 앱 스타일
- **util/** - 유틸리티별 CSS 파일

### `/frontend/public/` - 정적 파일
- **audio/** - 오디오 파일 (게임 효과음, 명상 호흡 소리)
- **images/** - 이미지 파일
- **txt/** - 텍스트 파일 (게임 데이터)

### 주요 의존성 (`package.json`)
- `next` - Next.js 프레임워크
- `react` - React 라이브러리
- `react-dom` - React DOM
- `typescript` - TypeScript

---

## 🏗️ HK 앱 구조 설계 (모듈화 완료)

### 컴포넌트 계층 구조

```
HKLayout (HKProvider 포함)
├── HKHeader
│   └── 검색창, 지역 선택, 네비게이션
├── Page Content
│   ├── HeroSection
│   ├── ThemesSection
│   │   └── ThemeCard (x4)
│   └── HotTravelSection
│       ├── CategoryFilter
│       ├── PlaceCard (동적)
│       ├── LoadingState
│       └── ErrorState
└── HKFooter
```

### 데이터 흐름

1. **전역 상태 관리**: `HKContext` (React Context API)
   - 카테고리, 검색어, 네비게이션 히스토리 관리

2. **데이터 로딩**: `useTravelData` Hook
   - API 호출 및 상태 관리
   - 로딩/에러 처리

3. **네비게이션**: 
   - PlaceCard 클릭 → 상세 페이지 (`/hk/[id]`)
   - 검색 → 검색 페이지 (`/hk/search`)
   - 상태 복원: 상세 페이지에서 돌아올 때 이전 카테고리 유지

### 주요 기능

1. **모듈화된 컴포넌트**
   - 각 컴포넌트가 단일 책임을 가짐
   - 재사용 가능한 구조
   - 독립적인 스타일 관리

2. **Custom Hooks**
   - `useTravelData`: 데이터 로딩 로직 분리
   - `useHorizontalScroll`: 가로 스크롤 기능 분리

3. **전역 상태 관리**
   - Context API로 앱 전체 상태 공유
   - 네비게이션 히스토리 저장/복원

4. **타입 안정성**
   - TypeScript로 모든 컴포넌트 타입 정의
   - API 응답 타입 명시

---

## ✅ FastAPI + Next.js 전환 상태

### ✅ 완료된 항목

#### Backend
- ✅ Django → FastAPI 전환 완료
- ✅ Django ORM → MongoDB (PyMongo) 전환
- ✅ Django Settings → Pydantic Settings 전환
- ✅ Django Views → FastAPI Routers 전환
- ✅ Django Templates 제거 (API만 제공)
- ✅ CORS 설정 완료
- ✅ 모든 API 엔드포인트 구현 완료

#### Frontend
- ✅ Django Templates → Next.js App Router 전환
- ✅ Django Static Files → Next.js Public 폴더 전환
- ✅ Django Template Tags → React 컴포넌트 전환
- ✅ 모든 페이지 마이그레이션 완료:
  - ✅ 메인 페이지
  - ✅ HK 앱 전체 (15개 페이지)
  - ✅ 유틸리티 전체 (10개 페이지)
  - ✅ 게임 전체 (7개 게임)
  - ✅ 블로그
- ✅ JavaScript 로직 → React Hooks 전환
- ✅ 모든 인터랙티브 기능 구현 완료:
  - ✅ 드래그, 휠, 직접 입력 편집
  - ✅ 오디오 재생
  - ✅ 모달
  - ✅ 애니메이션

#### HK 앱 구조 개선 (최신 작업)
- ✅ 컴포넌트 모듈화 완료
  - ✅ HeroSection, ThemesSection, HotTravelSection 분리
  - ✅ PlaceCard, ThemeCard, CategoryFilter 분리
  - ✅ LoadingState, ErrorState 분리
- ✅ Custom Hooks 생성
  - ✅ useTravelData (데이터 로딩)
  - ✅ useHorizontalScroll (가로 스크롤)
- ✅ 전역 상태 관리 (HKContext)
- ✅ 상세 페이지 및 검색 페이지 추가
- ✅ 네비게이션 로직 구현 (상태 복원)
- ✅ API 매핑 문서화

### 🔍 Django 의존성 확인

#### Backend
- ❌ Django 관련 코드 없음
- ✅ 순수 FastAPI + Pydantic + PyMongo 사용

#### Frontend
- ❌ Django 관련 코드 없음
- ✅ 순수 Next.js + React + TypeScript 사용

### 📝 남은 작업

1. **환경 변수 설정**
   - `backend/.env` 파일 생성 (env.example 참고)

2. **추가 기능 개발**
   - 사용자 인증 연동
   - 여행 계획 저장/불러오기
   - 즐겨찾기 기능

---

## 🚀 실행 방법

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload
```

백엔드는 `http://localhost:8000`에서 실행됩니다.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

---

## 📊 API 엔드포인트 요약

### HK API (`/api/v1/hk`)

#### 장소 관련
- `GET /api/v1/hk/refresh-section/` - 섹션 데이터 새로고침
  - 파라미터: `section_type` (tourist/event/accommodation/restaurant), `limit`
- `GET /api/v1/hk/search` - 장소 검색
  - 파라미터: `keyword`, `page`, `limit`
- `GET /api/v1/hk/place/{place_id}` - 장소 상세 정보
- `GET /api/v1/hk/theme/{theme_name}` - 테마별 장소 조회
  - 파라미터: `page`, `limit`

#### 여행 계획
- `POST /api/v1/hk/plan` - 여행 계획 생성
- `GET /api/v1/hk/plan/{plan_id}` - 여행 계획 조회
- `GET /api/v1/hk/plans` - 사용자 여행 계획 목록
  - 파라미터: `user_id`, `page`, `limit`

### Auth API (`/api/v1/auth`)
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/signup` - 회원가입

### Util API (`/api/v1/util`)
- `GET /api/v1/util/exchange-rate/` - 환율 조회
  - 파라미터: `from`, `to`
- `GET /api/v1/util/holidays/` - 공휴일 조회
  - 파라미터: `year`, `month`
- `GET /api/v1/util/lunar/` - 음력 변환
  - 파라미터: `year`, `month`, `day`
- `GET /api/v1/util/ip/` - IP 주소 조회

### Blog API (`/api/v1/blog`)
- `GET /api/v1/blog/info` - 블로그 정보
- `GET /api/v1/blog/posts` - 블로그 포스트 목록
  - 파라미터: `category`, `page`, `limit`

---

## 📚 추가 문서

### API 매핑 문서
- **frontend/src/app/hk/API_MAPPING.md** - 각 페이지와 백엔드 API 엔드포인트 연결 정보
  - 페이지별 사용 API
  - 파라미터 및 응답 형식
  - 네비게이션 플로우
  - 에러 처리 가이드

---

## 📝 결론

✅ **FastAPI + Next.js 전환이 완료되었습니다!**

- Django 의존성 완전 제거
- 모든 기능이 FastAPI + Next.js로 구현됨
- 원본 Django 프로젝트의 모든 기능과 디자인이 100% 유지됨
- **HK 앱 구조 재설계 및 모듈화 완료**
  - 재사용 가능한 컴포넌트 구조
  - Custom Hooks로 로직 분리
  - 전역 상태 관리 (Context API)
  - 타입 안정성 확보 (TypeScript)
  - 깔끔한 코드 구조 및 유지보수성 향상

### 주요 개선 사항

1. **모듈화**: 컴포넌트를 작은 단위로 분리하여 재사용성 향상
2. **관심사 분리**: 데이터 로딩, UI, 상태 관리를 각각 분리
3. **타입 안정성**: TypeScript로 컴파일 타임 에러 방지
4. **상태 관리**: Context API로 전역 상태 관리
5. **네비게이션**: 이전 상태 복원 기능으로 사용자 경험 개선
6. **문서화**: API 매핑 문서로 개발 가이드 제공
