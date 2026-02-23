# 서버 업로드 가이드

## 📋 업로드 전 확인사항

1. **프론트엔드 빌드 완료 확인**
   - `frontend/out/` 폴더가 존재하는지 확인
   - 빌드가 최신 상태인지 확인

2. **백엔드 .env 파일 준비**
   - 로컬의 `backend/.env` 파일 내용을 메모해두기 (서버에서 직접 생성)

---

## 📤 업로드해야 할 파일 목록

### 1. 백엔드 (backend 폴더)

#### ✅ 업로드할 파일/폴더
```
backend/
├── app/                    ← 전체 폴더 업로드
│   ├── api/
│   ├── core/
│   ├── main.py
│   ├── models/
│   ├── services/
│   └── utils/
├── scripts/                 ← 전체 폴더 업로드 (선택사항)
│   └── setup_cache_indexes.py
├── requirements.txt         ← 필수
└── env.example              ← 참고용 (선택사항)
```

#### ❌ 업로드하지 않을 파일
- `.env` (보안상 서버에서 직접 생성)
- `__pycache__/` (Python 캐시 파일)
- `*.pyc` (Python 컴파일 파일)
- `.git/` (Git 폴더)
- `logs/` (로그 폴더는 서버에서 자동 생성)

---

### 2. 프론트엔드 (빌드된 정적 파일만)

#### ✅ 업로드할 파일/폴더
```
frontend/
├── proxy.py                ← 프록시 스크립트 (선택, 방법 A 사용 시)
└── out/                    ← 전체 폴더 업로드 (빌드된 정적 파일)
    ├── _next/              ← Next.js 빌드 파일
    ├── ko/                 ← 한국어 페이지
    ├── en/                 ← 영어 페이지
    ├── index.html
    ├── 404.html
    ├── favicon.ico
    ├── audio/              ← 오디오 파일
    ├── images/             ← 이미지 파일
    └── txt/                ← 텍스트 파일
```

#### ❌ 업로드하지 않을 파일
- `node_modules/` (의존성 폴더, 용량 큼)
- `.next/` (빌드 중간 파일)
- `src/` (소스 코드, 빌드에 포함됨)
- `public/` (소스 파일, out에 포함됨)
- `package.json`, `package-lock.json` (개발용)
- `tsconfig.json`, `next.config.js` (개발용)
- `.git/` (Git 폴더)

---

## 🔧 알드라이브(Alldrive) 업로드 방법

### 1. 알드라이브 연결 설정

**SFTP 연결 정보:**
- **호스트**: `jiobi.kr` 또는 `211.47.75.63`
- **포트**: `22`
- **프로토콜**: `SFTP`
- **사용자명**: `jiobi`
- **비밀번호**: 가비아 서버 비밀번호

### 2. 서버 경로 확인

SSH로 접속해서 프로젝트 경로 확인:
```bash
ssh jiobi@jiobi.kr
pwd
ls -la
```

**예상 경로:**
- `/home/jiobi/` 또는
- `/web/jiobisite/` 또는
- 다른 경로 (서버에서 확인 필요)

### 3. 업로드 순서

#### Step 1: 백엔드 업로드
1. 알드라이브에서 서버 연결
2. 서버의 프로젝트 경로로 이동 (예: `/home/jiobi/`)
3. `backend/` 폴더 전체 업로드
   - `app/` 폴더 전체
   - `scripts/` 폴더 (있는 경우)
   - `requirements.txt`
   - `env.example` (참고용)

#### Step 2: 프론트엔드 업로드
1. 서버의 프로젝트 경로로 이동
2. `frontend/` 폴더 생성 (없는 경우)
3. `frontend/out/` 폴더 전체 업로드
   - `out/` 폴더 안의 모든 파일과 하위 폴더

---

## 📝 서버에서 추가 작업

### 1. SSH 접속
```bash
ssh jiobi@jiobi.kr
```

### 2. 프로젝트 경로로 이동
```bash
cd /경로/backend  # 실제 경로로 변경
```

### 3. 백엔드 .env 파일 생성
```bash
# env.example을 복사
cp env.example .env

# .env 파일 편집
nano .env
# 또는
vi .env
```

**필수 설정 항목:**
```bash
# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=jiobi

# JWT
JWT_SECRET_KEY=jaibocbdiegf10293847565647382910
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# TourAPI
TOUR_API_KEY=your-tour-api-key

# Kakao API
KAKAO_REST_API_KEY=da36570f8e0d863acd49fc4721b6489c

# Tistory Blog
TISTORY_BLOG_URL=https://your-blog.tistory.com

# Place API Provider
PLACE_API_PROVIDER=tour
```

### 4. Python 패키지 설치
```bash
cd /경로/backend
pip3 install -r requirements.txt --user
```

### 5. 로그 폴더 생성
```bash
# 백엔드 로그 폴더
mkdir -p /경로/backend/logs

# 프론트엔드 로그 폴더
mkdir -p /경로/frontend/logs
```

---

## ✅ 업로드 완료 후 확인사항

### 파일 구조 확인
```bash
# 백엔드 구조
ls -la /경로/backend/
ls -la /경로/backend/app/

# 프론트엔드 구조
ls -la /경로/frontend/out/
```

### 필수 파일 확인
```bash
# 백엔드
test -f /경로/backend/.env && echo ".env 파일 존재" || echo ".env 파일 없음"
test -f /경로/backend/requirements.txt && echo "requirements.txt 존재" || echo "requirements.txt 없음"

# 프론트엔드
test -f /경로/frontend/out/index.html && echo "index.html 존재" || echo "index.html 없음"
```

---

## 📊 업로드 파일 크기 예상

- **백엔드**: 약 1-2MB (소스 코드만)
- **프론트엔드 out 폴더**: 약 10-50MB (빌드된 정적 파일)

---

## ⚠️ 주의사항

1. **.env 파일은 절대 업로드하지 마세요**
   - 보안상 서버에서 직접 생성해야 합니다

2. **node_modules는 업로드하지 마세요**
   - 용량이 매우 크고 서버에서 필요 없습니다

3. **업로드 전 백업**
   - 서버에 기존 파일이 있다면 백업하세요

4. **권한 확인**
   - 업로드 후 파일 권한이 올바른지 확인하세요

---

## 🚀 업로드 후 다음 단계

업로드가 완료되면 `SSH_CONNECTION.md` 파일의 명령어를 따라 서버를 실행하세요.
