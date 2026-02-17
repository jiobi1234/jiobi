# 가비아 서버 배포 가이드

## ⚡ 빠른 시작 (처음 실행 시)

Putty를 열고 **아래 명령어를 순서대로** 실행하세요:

```bash
# 0. Node.js 설치 확인 (없으면 설치)
if ! command -v node &> /dev/null; then
    echo "Node.js가 없습니다. nvm을 설치합니다..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # nvm 활성화 (가비아 서버는 /web/.nvm에 설치될 수 있음)
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # /web/.nvm도 시도 (가비아 서버 특수 경로)
    if ! command -v nvm &> /dev/null; then
        export NVM_DIR="/web/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # 가비아 서버는 오래된 시스템이므로 v16 설치 (가장 안정적)
    nvm install 16
    nvm use 16
else
    # 이미 설치되어 있으면 nvm 활성화만 (가비아 서버 특수 경로 고려)
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 2>/dev/null || {
        export NVM_DIR="/web/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    }
fi

# 1. Python 패키지 설치
cd ~/backend
pip install -r requirements.txt --user

# 2. Node.js 패키지 설치 및 Next.js 다운그레이드
cd ~/frontend
# nvm 활성화
export NVM_DIR="/web/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 16

# Next.js를 v13으로 다운그레이드 (Node.js 16 호환)
npm install next@13 --save

# 3. 프론트엔드 빌드 (로컬에서 빌드했다면 생략 가능)
# npm run build

# 4. 실행 권한 부여
cd ~
chmod +x start_all.sh stop_all.sh
chmod +x backend/start_server.sh frontend/start_server.sh

# 5. 서버 시작
bash start_all.sh
```

**중요**: 위 단계를 모두 완료한 후에만 서버가 정상적으로 실행됩니다!

**참고**: Node.js 설치가 안 되거나 권한 문제가 있는 경우, 가비아 관리 콘솔(console.gabia.com)에서 Node.js 지원을 신청하거나 hosting@gabia.com으로 문의하세요.

---

## 📋 사전 준비사항

### 1. 서버 접속
- Putty 또는 SSH를 통해 가비아 서버에 접속합니다.
- 사용자 계정: `guser@python`

### 2. 파일 업로드 확인
- 알드라이브(SSH)를 통해 모든 파일이 업로드되었는지 확인합니다.
- 프로젝트 구조:
  ```
  ~/
  ├── backend/
  │   ├── app/
  │   ├── requirements.txt
  │   └── start_server.sh
  ├── frontend/
  │   ├── src/
  │   ├── package.json
  │   └── start_server.sh
  ├── start_all.sh
  └── stop_all.sh
  ```

## 🔧 설치 및 설정

### 0. Node.js 설치 확인 및 설치

먼저 Node.js가 설치되어 있는지 확인합니다:

```bash
# Node.js 확인
which node
which npm

# 또는 버전 확인
node --version
npm --version
```

**Node.js가 없는 경우**, nvm(Node Version Manager)을 사용하여 설치합니다:

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# nvm 활성화 (가비아 서버는 /web/.nvm에 설치될 수 있음)
# 방법 1: $HOME/.nvm 시도
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 방법 2: 위가 안 되면 /web/.nvm 시도 (가비아 서버 특수 경로)
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    export NVM_DIR="/web/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# nvm이 제대로 로드되었는지 확인
nvm --version

# Node.js 설치 (가비아 서버는 오래된 시스템이므로 v16 권장)
# v16이 가장 안정적으로 작동합니다
nvm install 16

# 설치된 Node.js 사용
nvm use 16

# 설치 확인
node --version
npm --version
```

**중요**: nvm 설치 후 **반드시** 위의 `export` 명령어를 실행해야 합니다. 
- 매번 Putty를 새로 열 때마다 nvm 활성화가 필요합니다.
- 또는 `.bashrc`에 자동으로 추가되어 있어서 쉘을 재시작하면 자동으로 활성화됩니다.

**참고**: 가비아 서버에서 Node.js 지원이 필요한 경우, 가비아 관리 콘솔(console.gabia.com)에서 문의하거나 hosting@gabia.com으로 문의하세요.

### 1. Python 패키지 설치

```bash
cd ~/backend
pip install -r requirements.txt --user
```

**중요**: `--user` 옵션을 반드시 사용하세요. (가비아 서버 권한 제한)

### 2. Node.js 패키지 설치

```bash
cd ~/frontend
npm install
```

### 3. 환경 변수 설정

백엔드 `.env` 파일 생성 (필요한 경우):

```bash
cd ~/backend
# .env 파일이 없다면 생성
nano .env
```

필요한 환경 변수 예시:
```
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key
TOUR_API_KEY=your_tour_api_key
KAKAO_REST_API_KEY=your_kakao_api_key
```

### 4. 프론트엔드 빌드

```bash
cd ~/frontend
npm run build
```

## 🚀 서버 실행

### 방법 1: 전체 서버 한 번에 시작 (권장)

```bash
cd ~
chmod +x start_all.sh
bash start_all.sh
```

### 방법 2: 개별 서버 시작

#### 백엔드만 시작
```bash
cd ~/backend
chmod +x start_server.sh
bash start_server.sh
```

#### 프론트엔드만 시작
```bash
cd ~/frontend
chmod +x start_server.sh
bash start_server.sh
```

## 📊 서버 상태 확인

### 프로세스 확인
```bash
# 백엔드 프로세스 확인
ps aux | grep gunicorn

# 프론트엔드 프로세스 확인
ps aux | grep "next start"

# 모든 프로세스 확인
ps aux | grep -E "gunicorn|next"
```

### 포트 확인
```bash
# 포트 8000 (백엔드)
netstat -tuln | grep 8000

# 포트 8080 (프론트엔드)
netstat -tuln | grep 8080
```

### 로그 확인
```bash
# 백엔드 로그
tail -f ~/backend/logs/backend_error.log
tail -f ~/backend/logs/backend_access.log

# 프론트엔드 로그
tail -f ~/frontend/logs/frontend.log
```

## 🛑 서버 종료

### 전체 서버 종료
```bash
cd ~
chmod +x stop_all.sh
bash stop_all.sh
```

### 개별 서버 종료

#### 백엔드만 종료
```bash
cd ~/backend
if [ -f "backend.pid" ]; then
    kill $(cat backend.pid)
    rm backend.pid
fi
```

#### 프론트엔드만 종료
```bash
cd ~/frontend
if [ -f "frontend.pid" ]; then
    kill $(cat frontend.pid)
    rm frontend.pid
fi
```

## 🔄 서버 재시작

```bash
cd ~
bash stop_all.sh
sleep 2
bash start_all.sh
```

## 📝 주요 포트 및 설정

- **프론트엔드**: 포트 8080 (외부 접근, https://jiobi.kr)
- **백엔드**: 포트 8000 (내부 포트, 프론트엔드에서 프록시로 접근)
- **호스트 바인딩**: 0.0.0.0 (가비아 서버 요구사항)

## ⚠️ 주의사항

1. **백그라운드 실행 필수**: 포그라운드로 실행하면 Putty 종료 시 서버도 함께 종료됩니다.
2. **포트 충돌**: 다른 프로세스가 8000 또는 8080 포트를 사용 중이면 충돌이 발생할 수 있습니다.
3. **로그 디렉토리**: `logs` 디렉토리가 없으면 자동으로 생성됩니다.
4. **권한 문제**: 스크립트 실행 권한이 없으면 `chmod +x` 명령으로 권한을 부여하세요.

## 🐛 문제 해결

### 백엔드가 시작되지 않는 경우
1. Python 패키지가 제대로 설치되었는지 확인:
   ```bash
   pip list --user | grep gunicorn
   ```
2. 포트 8000이 사용 중인지 확인:
   ```bash
   netstat -tuln | grep 8000
   ```
3. 로그 파일 확인:
   ```bash
   cat ~/backend/logs/backend_error.log
   ```

### 프론트엔드가 시작되지 않는 경우

#### Node.js 버전 문제 (Next.js 14는 Node.js 18+ 필요)

**문제**: `You are using Node.js 16.20.2. For Next.js, Node.js version >= v18.17.0 is required.`

**해결 방법 1: 로컬에서 빌드 후 업로드 (권장)**

1. **로컬(Windows)에서 빌드**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **`.next` 폴더를 서버에 업로드**:
   - 알드라이브(SSH)를 사용하여 `frontend/.next` 폴더 전체를 서버의 `~/frontend/.next`에 업로드

3. **서버에서 실행**:
   ```bash
   cd ~/frontend
   # nvm 활성화 (Node.js v16으로 실행만 하면 됨)
   export NVM_DIR="/web/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   nvm use 16
   
   # 서버 시작
   npm start
   ```

**해결 방법 2: Next.js 버전 다운그레이드**

서버에서 직접 빌드하려면 Next.js를 v13으로 다운그레이드:

```bash
cd ~/frontend
npm install next@13 react@18 react-dom@18 --save
npm run build
```

**참고**: Next.js v13은 Node.js 16.8+를 지원합니다.

#### 일반적인 문제 해결

1. 빌드가 완료되었는지 확인:
   ```bash
   ls -la ~/frontend/.next
   ```
2. 포트 8080이 사용 중인지 확인:
   ```bash
   netstat -tuln | grep 8080
   ```
3. 로그 파일 확인:
   ```bash
   cat ~/frontend/logs/frontend.log
   ```
4. 실행 권한 문제:
   ```bash
   chmod +x node_modules/.bin/*
   ```

### 프로세스가 계속 종료되는 경우
1. 메모리 부족 확인:
   ```bash
   free -h
   ```
2. 디스크 공간 확인:
   ```bash
   df -h
   ```

## 📞 추가 도움말

- 가비아 Python 호스팅 가이드: http://wiki.gabia.io/python
- 가비아 1:1 게시판 또는 hosting@gabia.com으로 문의

