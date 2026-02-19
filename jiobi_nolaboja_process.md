# JIOBI 여행 페이지 (https://jiobi.kr/ko/hk) 개발 가이드

> 초보 개발자도 이해할 수 있도록 작성된 전체 프로세스 및 모듈 설명서

---

## 📋 목차

1. [페이지 개요](#페이지-개요)
2. [전체 구조](#전체-구조)
3. [컴포넌트 계층 구조](#컴포넌트-계층-구조)
4. [데이터 플로우](#데이터-플로우)
5. [API 엔드포인트 매핑](#api-엔드포인트-매핑)
6. [상태 관리 (Context)](#상태-관리-context)
7. [주요 기능별 설명](#주요-기능별-설명)
8. [모듈 설명](#모듈-설명)

---

## 페이지 개요

### URL
- **프로덕션**: https://jiobi.kr/ko/hk
- **로컬 개발**: http://localhost:3000/ko/hk

### 기술 스택
- **프론트엔드**: Next.js 13 (App Router), React, TypeScript
- **백엔드**: FastAPI (Python)
- **데이터베이스**: MongoDB
- **외부 API**: TourAPI, Kakao API, Google Maps API

### 주요 기능
1. 여행 계획 만들기 (AI 자동 생성 / 수동 생성)
2. 테마별 여행 장소 추천
3. 카테고리별 인기 여행지 조회
4. 장소 검색 및 상세 정보 조회
5. 위시리스트 관리 (로그인 필요)
6. 여행 계획 저장 및 관리 (로그인 필요)

---

## 전체 구조

### 파일 구조

```
frontend/src/
├── app/[locale]/hk/
│   ├── page.tsx                    # 메인 페이지 (이 문서의 주제)
│   ├── plan/                       # 여행 계획 관련
│   │   ├── select/page.tsx        # (선택) 계획 생성 방식 선택 (메인에서 바로 AI/수동 이동 가능)
│   │   ├── ai/page.tsx            # AI 자동 계획 생성
│   │   ├── create/page.tsx        # 수동 계획 생성
│   │   └── [id]/                  # 계획 상세/수정
│   ├── theme/[themeName]/         # 테마별 장소 페이지
│   ├── search/                    # 장소 검색 페이지
│   ├── wishlist/                  # 위시리스트 페이지
│   └── ...
│
├── components/hk/
│   ├── HeroSection.tsx            # 상단 히어로 섹션 (AI로 계획 만들기 / 수동 계획 만들기 버튼)
│   ├── ThemesSection.tsx          # 테마 섹션
│   ├── HotTravelSection.tsx       # 인기 여행지 섹션
│   ├── PlaceCard.tsx              # 장소 카드 컴포넌트
│   ├── ThemeCard.tsx              # 테마 카드 컴포넌트
│   ├── CategoryFilter.tsx         # 카테고리 필터
│   └── ...
│
├── contexts/
│   ├── HKContext.tsx              # HK 통합 Context (상태 관리)
│   ├── HKFilterContext.tsx        # 필터 Context
│   └── HKSearchContext.tsx        # 검색 Context
│
├── hooks/hk/
│   ├── useTravelData.ts           # 여행 데이터 로딩 훅
│   └── useHKThemes.ts             # 테마 목록 로딩 훅
│
└── lib/api-client/
    ├── hk-client.ts               # HK API 클라이언트
    └── base-client.ts             # 기본 API 클라이언트

backend/app/
├── api/
│   └── hk.py                      # HK API 라우터
├── services/
│   ├── tour_service.py            # 여행 서비스 로직
│   ├── place_service.py            # 장소 서비스 로직
│   └── theme_service.py           # 테마 서비스 로직
└── main.py                        # FastAPI 앱 엔트리포인트
```

---

## 컴포넌트 계층 구조

### 메인 페이지 (`/ko/hk`)

```
HKLayout (레이아웃)
  ├── JIOBI 헤더 (로고, 네비게이션)
  ├── HKHeader (HK 전용 헤더)
  │
  └── HKMainPage (메인 컨텐츠)
      └── HKMainContent
          ├── HeroSection (히어로 섹션)
          │   ├── "AI로 계획 만들기" 버튼 → /plan/ai
          │   └── "수동 계획 만들기" 버튼 → /plan/create
          │
          ├── ThemesSection (테마 섹션)
          │   └── ThemeCard × N (테마 카드들)
          │
          └── HotTravelSection (인기 여행지 섹션)
              ├── CategoryFilter (카테고리 필터)
              └── PlaceCard × N (장소 카드들)
```

### Context Provider 계층

```
HKProvider
  ├── HKFilterProvider (카테고리 필터 상태)
  ├── HKSearchProvider (검색어 상태)
  └── HKContextInner (통합 Context)
      ├── 네비게이션 히스토리
      ├── 장소 캐시
      └── 위시리스트 상태
```

---

## 데이터 플로우

### 1. 페이지 로드 시

```
[사용자] 
  ↓ https://jiobi.kr/ko/hk 접속
[Next.js App Router]
  ↓ page.tsx 렌더링
[HKLayout]
  ↓ HKProvider로 감싸기
[HKMainContent]
  ↓
  ├─ HeroSection 렌더링 (동적 로딩)
  ├─ ThemesSection 렌더링 (동적 로딩)
  │   └─ useHKThemes() 훅 호출
  │       └─ apiClient.hk.getThemes() → GET /api/v1/hk/themes
  │
  └─ HotTravelSection 렌더링 (동적 로딩)
      └─ useTravelData(selectedCategory) 훅 호출
          └─ apiClient.hk.refreshSection() → GET /api/v1/hk/refresh-section/
```

### 2. 카테고리 필터 변경 시

```
[사용자] CategoryFilter에서 카테고리 선택
  ↓
[HKFilterContext] selectedCategory 상태 변경
  ↓
[useTravelData] category 변경 감지
  ↓
[apiClient.hk.refreshSection(category)] API 호출
  ↓
[백엔드] TourService.refresh_section()
  ├─ TourAPI 또는 KakaoAPI 호출 (설정에 따라)
  └─ 장소 데이터 반환
  ↓
[프론트엔드] places 상태 업데이트
  ↓
[HotTravelSection] PlaceCard 리렌더링
```

### 3. 메인 히어로에서 계획 만들기 버튼 클릭 시

```
[사용자] "AI로 계획 만들기" 또는 "수동 계획 만들기" 버튼 클릭
  ↓
[HeroSection] handlePlanClick('ai' | 'manual') 실행
  ↓
[로그인 체크] apiClient.auth.isAuthenticated()
  ├─ 로그인 안 됨 → /ko/hk/login 페이지로 이동
  └─ 로그인 됨
      ├─ AI 버튼 클릭 → /ko/hk/plan/ai (window.location.href)
      └─ 수동 버튼 클릭 → /ko/hk/plan/create (router.push)
```

### 4. 장소 카드 클릭 시

```
[사용자] PlaceCard 클릭
  ↓
[PlaceCard] handleClick() 실행
  ↓
[HKContext] 네비게이션 히스토리 저장 (카테고리 정보)
  ↓
[Next.js Router] /ko/hk/{placeId} 페이지로 이동
  ↓
[장소 상세 페이지] apiClient.hk.getPlaceDetail(placeId)
  └─ GET /api/v1/hk/place/{placeId}
```

---

## API 엔드포인트 매핑

### 프론트엔드 → 백엔드 매핑

| 프론트엔드 호출 | 백엔드 엔드포인트 | 설명 |
|----------------|-----------------|------|
| `apiClient.hk.refreshSection()` | `GET /api/v1/hk/refresh-section/` | 카테고리별 장소 조회 |
| `apiClient.hk.searchPlaces()` | `GET /api/v1/hk/search` | 장소 검색 |
| `apiClient.hk.getPlaceDetail()` | `GET /api/v1/hk/place/{place_id}` | 장소 상세 정보 |
| `apiClient.hk.getThemePlaces()` | `GET /api/v1/hk/theme/{theme_name}` | 테마별 장소 조회 |
| `apiClient.hk.getThemes()` | `GET /api/v1/hk/themes` | 테마 목록 조회 |
| `apiClient.hk.createPlan()` | `POST /api/v1/hk/plan` | 여행 계획 생성 (로그인 필요) |
| `apiClient.hk.getWishlist()` | `GET /api/v1/hk/wishlist` | 위시리스트 조회 (로그인 필요) |
| `apiClient.hk.addToWishlist()` | `POST /api/v1/hk/wishlist` | 위시리스트 추가 (로그인 필요) |
| `apiClient.hk.removeFromWishlist()` | `DELETE /api/v1/hk/wishlist/{place_id}` | 위시리스트 제거 (로그인 필요) |

### 백엔드 서비스 구조

```
API 라우터 (hk.py)
  ↓
서비스 레이어
  ├─ TourService (여행 서비스)
  │   ├─ refresh_section() → TourAPI/KakaoAPI 호출
  │   └─ get_theme_places() → MongoDB에서 테마별 장소 조회
  │
  ├─ PlaceService (장소 서비스)
  │   ├─ search_places() → TourAPI/KakaoAPI 검색
  │   └─ get_place_detail() → 장소 상세 정보 조회
  │
  └─ ThemeService (테마 서비스)
      └─ get_themes() → MongoDB에서 테마 목록 조회
```

---

## 상태 관리 (Context)

### HKContext 구조

HKContext는 여러 하위 Context를 통합하여 제공합니다:

#### 1. HKFilterContext (필터 상태)
```typescript
{
  selectedCategory: string;        // 현재 선택된 카테고리
  setSelectedCategory: (category: string) => void;
  resetFilter: () => void;
}
```

**사용 위치**: 
- `HotTravelSection` - 카테고리 필터링
- `CategoryFilter` - 카테고리 선택 UI

#### 2. HKSearchContext (검색 상태)
```typescript
{
  searchKeyword: string;           // 검색어
  setSearchKeyword: (keyword: string) => void;
  resetSearch: () => void;
}
```

**사용 위치**: 
- 검색 페이지 (`/ko/hk/search`)

#### 3. HKContext (통합 Context)
```typescript
{
  // 네비게이션 히스토리 (이전 페이지로 돌아갈 때 상태 유지)
  navigationHistory: {
    category?: string;
    keyword?: string;
    scrollPosition?: number;
  };
  setNavigationHistory: (history: HKNavigationHistory) => void;
  
  // 장소 캐시 (검색 결과를 저장하여 상세 페이지에서 재사용)
  placeCache: { [placeId: string]: Place };
  getPlaceFromCache: (placeId: string) => Place | undefined;
  addPlaceToCache: (place: Place) => void;
  
  // 위시리스트 상태
  wishlist: { [placeId: string]: WishlistItem };
  isPlaceLiked: (placeId: string) => boolean;
  setWishlist: (updater: (prev) => WishlistMap) => void;
  
  // 하위 호환성 (Filter/Search Context 접근)
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
}
```

**사용 위치**: 
- 모든 HK 페이지에서 사용 가능
- 장소 상세 페이지에서 캐시된 데이터 재사용
- 위시리스트 상태 관리

---

## 주요 기능별 설명

### 1. HeroSection (히어로 섹션)

**위치**: `frontend/src/components/hk/HeroSection.tsx`

**기능**:
- 메인 타이틀 표시
- "AI로 계획 만들기", "수동 계획 만들기" 두 버튼 제공 (메인에서 바로 선택)

**동작 흐름**:
```
[버튼 클릭] (AI 또는 수동)
  ↓
handlePlanClick('ai' | 'manual') 실행
  ↓
로그인 체크 (apiClient.auth.isAuthenticated())
  ├─ 미로그인 → 로그인 페이지로 이동
  └─ 로그인됨 → AI면 /plan/ai, 수동이면 /plan/create 로 바로 이동
```

**현재 상태**: 로그인 체크 후 AI/수동 페이지로 직접 이동 (계획 선택 페이지 생략)

---

### 2. ThemesSection (테마 섹션)

**위치**: `frontend/src/components/hk/ThemesSection.tsx`

**기능**:
- 테마 목록 표시 (K-POP, 음식, 문화, 자연 등)
- 테마 카드 클릭 시 테마별 장소 페이지로 이동

**데이터 로딩**:
```typescript
const { themes, loading, error } = useHKThemes();
// → apiClient.hk.getThemes() 호출
// → GET /api/v1/hk/themes
```

**동작 흐름**:
```
[페이지 로드]
  ↓
useHKThemes() 훅 실행
  ↓
apiClient.hk.getThemes() → 백엔드 API 호출
  ↓
테마 목록 받아오기
  ↓
ThemeCard 컴포넌트로 렌더링
  ↓
[테마 카드 클릭]
  ↓
/ko/hk/theme/{themeId} 페이지로 이동
```

---

### 3. HotTravelSection (인기 여행지 섹션)

**위치**: `frontend/src/components/hk/HotTravelSection.tsx`

**기능**:
- 카테고리별 인기 여행지 표시
- 카테고리 필터 변경 시 해당 카테고리 장소 조회

**데이터 로딩**:
```typescript
const { places, loading, error, refetch } = useTravelData(selectedCategory);
// → apiClient.hk.refreshSection(category) 호출
// → GET /api/v1/hk/refresh-section/?section_type={category}&limit=6
```

**동작 흐름**:
```
[카테고리 선택]
  ↓
CategoryFilter에서 카테고리 변경
  ↓
HKFilterContext의 selectedCategory 상태 변경
  ↓
useTravelData(selectedCategory) 훅이 변경 감지
  ↓
apiClient.hk.refreshSection(category) 호출
  ↓
백엔드: TourService.refresh_section()
  ├─ TourAPI 또는 KakaoAPI 호출 (설정에 따라)
  └─ 장소 데이터 반환
  ↓
places 상태 업데이트
  ↓
PlaceCard 컴포넌트로 렌더링
```

**카테고리 종류**:
- `restaurant` (음식점)
- `shopping` (쇼핑)
- `accommodation` (숙박)
- `travel_course` (여행코스)

---

### 4. PlaceCard (장소 카드)

**위치**: `frontend/src/components/hk/PlaceCard.tsx`

**기능**:
- 장소 정보 표시 (이미지, 제목, 주소)
- 위시리스트 추가/제거 (로그인 필요)
- 장소 클릭 시 상세 페이지로 이동

**동작 흐름**:
```
[장소 카드 클릭]
  ↓
handleClick() 실행
  ↓
네비게이션 히스토리 저장 (현재 카테고리)
  ↓
/ko/hk/{placeId} 페이지로 이동

[위시리스트 버튼 클릭]
  ↓
handleWishlistClick() 실행
  ↓
로그인 체크
  ├─ 미로그인 → 토스트 메시지 표시
  └─ 로그인됨 → 위시리스트 추가/제거 API 호출
      ↓
      POST /api/v1/hk/wishlist (추가)
      또는
      DELETE /api/v1/hk/wishlist/{place_id} (제거)
```

---

## 모듈 설명

### 프론트엔드 모듈

#### 1. API 클라이언트 (`lib/api-client/`)

**HkClient** (`hk-client.ts`):
- HK 관련 모든 API 호출을 담당
- BaseApiClient를 상속받아 구현
- 자동으로 토큰 관리 (로그인 필요 API)

**주요 메서드**:
- `refreshSection()` - 카테고리별 장소 조회
- `searchPlaces()` - 장소 검색
- `getPlaceDetail()` - 장소 상세 정보
- `getThemes()` - 테마 목록 조회
- `getWishlist()` - 위시리스트 조회 (로그인 필요)
- `addToWishlist()` - 위시리스트 추가 (로그인 필요)
- `removeFromWishlist()` - 위시리스트 제거 (로그인 필요)

#### 2. 커스텀 훅 (`hooks/hk/`)

**useTravelData** (`useTravelData.ts`):
- 카테고리별 여행 데이터를 가져오는 훅
- `selectedCategory` 변경 시 자동으로 데이터 재로딩
- 로딩 상태, 에러 상태 관리

**useHKThemes** (`useHKThemes.ts`):
- 테마 목록을 가져오는 훅
- 페이지 로드 시 자동으로 테마 목록 조회

#### 3. Context (`contexts/`)

**HKProvider**:
- HK 관련 모든 상태를 제공하는 최상위 Provider
- 하위에 HKFilterProvider, HKSearchProvider 포함
- 위시리스트, 장소 캐시, 네비게이션 히스토리 관리

**HKFilterProvider**:
- 카테고리 필터 상태만 관리
- 불필요한 리렌더링 방지를 위해 분리

**HKSearchProvider**:
- 검색어 상태만 관리
- 불필요한 리렌더링 방지를 위해 분리

#### 4. 컴포넌트 (`components/hk/`)

**HeroSection**:
- 메인 페이지 상단 히어로 섹션
- "AI로 계획 만들기", "수동 계획 만들기" 버튼 포함 (선택 페이지 없이 바로 이동)

**ThemesSection**:
- 테마 목록을 가로 스크롤로 표시
- HorizontalScrollSection 컴포넌트 사용

**HotTravelSection**:
- 카테고리 필터와 장소 카드 목록 표시
- CategoryFilter와 PlaceCard 컴포넌트 사용

**PlaceCard**:
- 장소 정보를 카드 형태로 표시
- 위시리스트 기능 포함
- React.memo로 최적화

**ThemeCard**:
- 테마 정보를 카드 형태로 표시
- React.memo로 최적화

---

### 백엔드 모듈

#### 1. API 라우터 (`api/hk.py`)

**역할**: FastAPI 라우터로 HTTP 요청을 받아 서비스 레이어로 전달

**주요 엔드포인트**:
- `GET /api/v1/hk/refresh-section/` - 섹션 데이터 새로고침
- `GET /api/v1/hk/search` - 장소 검색
- `GET /api/v1/hk/place/{place_id}` - 장소 상세 정보
- `GET /api/v1/hk/theme/{theme_name}` - 테마별 장소 조회
- `GET /api/v1/hk/themes` - 테마 목록 조회
- `POST /api/v1/hk/plan` - 여행 계획 생성 (로그인 필요)
- `GET /api/v1/hk/wishlist` - 위시리스트 조회 (로그인 필요)
- `POST /api/v1/hk/wishlist` - 위시리스트 추가 (로그인 필요)
- `DELETE /api/v1/hk/wishlist/{place_id}` - 위시리스트 제거 (로그인 필요)

#### 2. 서비스 레이어 (`services/`)

**TourService** (`tour_service.py`):
- 여행 관련 비즈니스 로직
- `refresh_section()` - TourAPI/KakaoAPI를 사용하여 카테고리별 장소 조회
- `get_theme_places()` - MongoDB에서 테마별 장소 조회
- 설정에 따라 TourAPI 또는 KakaoAPI 선택

**PlaceService** (`place_service.py`):
- 장소 관련 비즈니스 로직
- `search_places()` - TourAPI/KakaoAPI를 사용하여 장소 검색
- `get_place_detail()` - 장소 상세 정보 조회
- 두 API 결과를 통합하여 데이터 보강

**ThemeService** (`theme_service.py`):
- 테마 관련 비즈니스 로직
- `get_themes()` - MongoDB에서 테마 목록 조회

#### 3. 외부 API 클라이언트 (`api/`)

**TourAPI** (`tour_api.py`):
- 한국관광공사 TourAPI 클라이언트
- 장소 검색, 카테고리별 조회 등

**KakaoAPI** (`kakao_api.py`):
- Kakao API 클라이언트
- 장소 검색, 지도, 길찾기 등

---

## 주요 프로세스 상세 설명

### 프로세스 1: 페이지 초기 로딩

```
1. 사용자가 https://jiobi.kr/ko/hk 접속
   ↓
2. Next.js App Router가 page.tsx 렌더링
   ↓
3. HKLayout 컴포넌트 렌더링
   ├─ JIOBI 헤더 표시
   ├─ HKHeader 표시
   └─ HKProvider로 감싸기
      ↓
4. HKMainContent 컴포넌트 렌더링
   ├─ HeroSection (동적 로딩)
   │   └─ 즉시 렌더링 (API 호출 없음)
   │
   ├─ ThemesSection (동적 로딩)
   │   └─ useHKThemes() 훅 실행
   │       └─ GET /api/v1/hk/themes
   │           ↓
   │           백엔드: ThemeService.get_themes()
   │           ↓
   │           MongoDB에서 테마 목록 조회
   │           ↓
   │           테마 목록 반환
   │           ↓
   │           ThemeCard 컴포넌트로 렌더링
   │
   └─ HotTravelSection (동적 로딩)
       └─ useTravelData('restaurant') 훅 실행 (기본값)
           └─ GET /api/v1/hk/refresh-section/?section_type=restaurant&limit=6
               ↓
               백엔드: TourService.refresh_section()
               ↓
               TourAPI 또는 KakaoAPI 호출 (설정에 따라)
               ↓
               장소 데이터 반환
               ↓
               PlaceCard 컴포넌트로 렌더링
```

### 프로세스 2: 카테고리 필터 변경

```
1. 사용자가 CategoryFilter에서 카테고리 선택 (예: "쇼핑")
   ↓
2. CategoryFilter의 onChange 이벤트 발생
   ↓
3. onFilterChange('shopping') 호출
   ↓
4. HKFilterContext의 setSelectedCategory('shopping') 실행
   ↓
5. selectedCategory 상태 변경
   ↓
6. useTravelData(selectedCategory) 훅이 category 변경 감지
   ↓
7. loadFilteredData() 함수 실행
   ↓
8. apiClient.hk.refreshSection('shopping') 호출
   ↓
9. GET /api/v1/hk/refresh-section/?section_type=shopping&limit=6
   ↓
10. 백엔드: TourService.refresh_section('shopping')
    ├─ 카테고리 매핑: shopping → contentTypeId "38"
    └─ TourAPI 또는 KakaoAPI 호출
        ↓
11. 장소 데이터 반환
    ↓
12. places 상태 업데이트
    ↓
13. HotTravelSection 리렌더링
    ↓
14. PlaceCard 컴포넌트들 업데이트
```

### 프로세스 3: 여행 계획 만들기

```
1. 사용자가 메인에서 "AI로 계획 만들기" 또는 "수동 계획 만들기" 버튼 클릭
   ↓
2. HeroSection의 handlePlanClick('ai' | 'manual') 실행
   ↓
3. 로그인 체크: apiClient.auth.isAuthenticated()
   ├─ false (미로그인)
   │   └─ showToast('info', '로그인 후 계획을 만들 수 있습니다.')
   │   └─ router.push('/ko/hk/login')
   │
   └─ true (로그인됨)
       ├─ AI 버튼 클릭 → window.location.href = '/ko/hk/plan/ai'
       └─ 수동 버튼 클릭 → router.push('/ko/hk/plan/create')
```

### 프로세스 4: 장소 상세 페이지 이동

```
1. 사용자가 PlaceCard 클릭
   ↓
2. PlaceCard의 handleClick() 실행
   ↓
3. 네비게이션 히스토리 저장
   setNavigationHistory({ category: selectedCategory })
   ↓
4. router.push(`/ko/hk/${placeId}`)
   ↓
5. 장소 상세 페이지 로드
   ↓
6. apiClient.hk.getPlaceDetail(placeId) 호출
   ↓
7. GET /api/v1/hk/place/{place_id}
   ↓
8. 백엔드: PlaceService.get_place_detail()
   └─ 장소 상세 정보 반환
   ↓
9. 장소 상세 정보 표시
```

### 프로세스 5: 위시리스트 추가

```
1. 사용자가 PlaceCard의 위시리스트 버튼 클릭
   ↓
2. PlaceCard의 handleWishlistClick() 실행
   ↓
3. 로그인 체크: apiClient.auth.isAuthenticated()
   ├─ false (미로그인)
   │   └─ showToast('info', '로그인 후 위시리스트를 사용할 수 있습니다.')
   │
   └─ true (로그인됨)
       ↓
       4. apiClient.hk.addToWishlist(place) 호출
       ↓
       5. POST /api/v1/hk/wishlist
       ↓
       6. 백엔드: WishlistService.add_to_wishlist()
       └─ MongoDB에 위시리스트 아이템 저장
       ↓
       7. 위시리스트 아이템 반환
       ↓
       8. HKContext의 wishlist 상태 업데이트
       ↓
       9. PlaceCard의 하트 아이콘 변경 (♡ → ♥)
```

---

## 데이터 모델

### Place (장소)

```typescript
interface Place {
  id?: string;                    // 장소 ID
  place_id?: string;              // 장소 ID (대체 필드)
  title?: string;                // 장소 이름
  place_name?: string;            // 장소 이름 (대체 필드)
  address?: string;              // 주소
  address_name?: string;         // 주소 (대체 필드)
  image?: string;                // 이미지 URL
  latitude?: number;             // 위도
  longitude?: number;            // 경도
  category?: string;             // 카테고리
  region?: string;               // 지역 (시도)
  district?: string;             // 구/군
  // ... 기타 필드
}
```

### Theme (테마)

```typescript
interface Theme {
  id: string;                    // 테마 ID
  name_ko: string;               // 한국어 이름
  name_en: string;               // 영어 이름
  description_ko?: string;       // 한국어 설명
  description_en?: string;       // 영어 설명
  places?: Place[];             // 테마에 속한 장소들
}
```

### WishlistItem (위시리스트 아이템)

```typescript
interface WishlistItem {
  place_id: string;             // 장소 ID
  title: string;                 // 장소 이름
  address: string;               // 주소
  image?: string;               // 이미지 URL
  // ... 기타 필드
}
```

---

## 설정 및 환경 변수

### 프론트엔드 설정

**API URL 설정**: `frontend/src/lib/api-client/config.ts`
- 개발: `http://localhost:8000`
- 프로덕션: `https://jiobi.kr` (또는 환경 변수)

### 백엔드 설정

**환경 변수** (`.env` 파일):
- `MONGODB_URL` - MongoDB 연결 문자열
- `TOUR_API_KEY` - TourAPI 키
- `KAKAO_REST_API_KEY` - Kakao API 키
- `PLACE_API_PROVIDER` - 기본 API 제공자 (`tour` 또는 `kakao`)

---

## 주요 개선 사항 (예정)

### 1. 로그인 체크 제거
- **현재**: HeroSection에서 로그인 체크 후 로그인 페이지 또는 AI/수동 계획 페이지로 이동
- **변경 예정**: 로그인 체크 제거, 메인에서 바로 AI/수동 계획 페이지로 이동

### 2. 광고 페이지 추가
- **추가 예정**: AI 자동 계획 생성 시 광고 페이지 표시
- **경로**: `/ko/hk/plan/ad`
- **조건**: AI 자동 생성 버튼 클릭 시에만 표시

---

## 참고 사항

### 코드 스플리팅
- HeroSection, ThemesSection, HotTravelSection은 `dynamic()`으로 동적 로딩
- 초기 로딩 속도 향상을 위해 사용

### 상태 관리 최적화
- HKFilterContext, HKSearchContext를 분리하여 불필요한 리렌더링 방지
- React.memo를 사용하여 컴포넌트 최적화

### 에러 처리
- useApiError 훅을 사용하여 API 에러 처리
- ErrorBoundary로 컴포넌트 에러 처리

### 다국어 지원
- next-intl을 사용하여 한국어/영어 지원
- 메시지는 `messages/ko.json`, `messages/en.json`에 정의

---

## 개발자 가이드

### 새로운 기능 추가 시

1. **API 엔드포인트 추가**
   - 백엔드: `backend/app/api/hk.py`에 라우터 추가
   - 프론트엔드: `frontend/src/lib/api-client/hk-client.ts`에 메서드 추가

2. **새 컴포넌트 추가**
   - `frontend/src/components/hk/` 폴더에 컴포넌트 생성
   - 필요시 Context나 훅 추가

3. **상태 관리 추가**
   - 기존 Context 활용 또는 새 Context 생성
   - 불필요한 리렌더링 방지를 위해 Context 분리 고려

### 디버깅 팁

1. **브라우저 개발자 도구**
   - Network 탭에서 API 호출 확인
   - Console 탭에서 로그 확인

2. **React DevTools**
   - Context 상태 확인
   - 컴포넌트 props 확인

3. **백엔드 로그**
   - FastAPI 자동 생성 문서: `http://localhost:8000/docs`
   - 터미널에서 에러 로그 확인

---

## 마무리

이 문서는 https://jiobi.kr/ko/hk 페이지의 전체 구조와 프로세스를 설명합니다.
초보 개발자도 이 문서를 참고하여 코드를 이해하고 수정할 수 있습니다.

추가 질문이나 수정 사항이 있으면 언제든지 문의하세요!
