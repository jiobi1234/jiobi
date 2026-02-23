# SSH 연결 및 서버 실행 가이드 (jiobi.kr)

---

## 1. SSH 접속 (Windows)

### 권장: 호스트 키 옵션 포함 (가비아 서버용)
```powershell
ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa jiobi@jiobi.kr
```
`no matching host key type found. Their offer: ssh-rsa` 오류가 나면 위처럼 옵션을 붙여서 접속합니다.

### 다른 접속 방법
| 목적 | 명령어 |
|------|--------|
| IP로 접속 | `ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa jiobi@211.47.75.63` |
| 포트 지정 | `ssh -p 22 -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa jiobi@jiobi.kr` |
| SSH 키 사용 | `ssh -i C:\Users\사용자명\.ssh\id_rsa -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa jiobi@jiobi.kr` |

### 매번 옵션 없이 접속하려면
`C:\Users\사용자명\.ssh\config` 에 아래 추가 후 `ssh jiobi@jiobi.kr` 만 입력하면 됩니다.
```
Host jiobi.kr 211.47.75.63
  HostName jiobi.kr
  User jiobi
  HostKeyAlgorithms +ssh-rsa
  PubkeyAcceptedAlgorithms +ssh-rsa
```

---

## 2. 서버에서 할 일 (순서대로)

접속 후 **리눅스 셸**에서 실행합니다.

**서버는 두 개입니다.**
- **백엔드**: `backend/` 에서 실행 → gunicorn (포트 8001, API)
- **프록시**: `frontend/out/` 에서 실행 → Python (포트 8080, 웹 페이지 + `/api/` 를 백엔드로 전달)

### 2-1. 기존 서버 종료 (이미 돌고 있으면)
같은 포트에서 다시 띄우려면 먼저 꺼야 합니다.
```bash
# 포트로 한 번에 종료
lsof -ti:8080 | xargs kill   # 프록시 (8080)
lsof -ti:8001 | xargs kill   # 백엔드 (8001)
```
또는 `ps aux | grep gunicorn` / `ps aux | grep "python3 -c"` 로 PID 확인 후 `kill [PID]`

### 2-2. 프로젝트 경로로 이동
```bash
cd /web/jiobisite
```
(실제 경로가 다르면 서버에서 `pwd` / `ls` 로 확인 후 해당 경로로 이동)

### 2-3. out 폴더 압축 풀기 (이미 풀었으면 생략)
```bash
cd /web/jiobisite/frontend
unzip -o out.zip -d .
```
`unzip`이 없으면:
```bash
cd /web/jiobisite/frontend
python3 -c "import zipfile; zipfile.ZipFile('out.zip').extractall('.')"
```
→ 최종적으로 `frontend/out/` 안에 `index.html`, `_next/`, `ko/`, `en/` 등이 있으면 됩니다.

### 2-4. 백엔드 .env 확인
```bash
cd /web/jiobisite/backend
test -f .env && echo "있음" || (cp env.example .env && echo ".env 생성됨. nano .env 로 내용 채우기")
```

### 2-5. 백엔드 서버 실행 (백그라운드)
**실행 위치: `/web/jiobisite/backend`**
```bash
cd /web/jiobisite/backend
mkdir -p logs
nohup gunicorn app.main:app --bind 0.0.0.0:8001 --workers 2 --worker-class uvicorn.workers.UvicornWorker > logs/backend.log 2>&1 &
```

### 2-6. 프록시 서버 실행 (백그라운드)

**방법 A: proxy.py 사용** (frontend 폴더에 proxy.py 업로드 후)
```bash
cd /web/jiobisite/frontend
mkdir -p logs
nohup python3 proxy.py > logs/proxy.log 2>&1 &
```

**방법 B: 인라인 명령** (실행 위치: `/web/jiobisite/frontend/out`)
```bash
cd /web/jiobisite/frontend/out
mkdir -p ../logs
nohup python3 -c "
import http.server, socketserver, urllib.parse, urllib.request, os

BACKEND_URL = 'http://localhost:8001'
FRONTEND_DIR = os.getcwd()
PORT = 8080

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)
    def translate_path(self, path):
        decoded_path = urllib.parse.unquote(urllib.parse.unquote(path))
        return super().translate_path(decoded_path)
    def do_GET(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else: self.serve_static_file()
    def do_POST(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else: self.send_error(404, 'Not Found')
    def do_PUT(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else: self.send_error(404, 'Not Found')
    def do_DELETE(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else: self.send_error(404, 'Not Found')
    def do_PATCH(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else: self.send_error(404, 'Not Found')
    def do_OPTIONS(self):
        if self.path.startswith('/api/'): self.proxy_to_backend()
        else:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()
    def proxy_to_backend(self):
        try:
            backend_url = BACKEND_URL + self.path
            headers = {k: v for k, v in self.headers.items() if k.lower() != 'host'}
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            req = urllib.request.Request(backend_url, data=body, headers=headers, method=self.command)
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for h, v in response.headers.items():
                    if h.lower() not in ('content-encoding', 'transfer-encoding', 'connection'):
                        self.send_header(h, v)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for h, v in e.headers.items():
                if h.lower() not in ('content-encoding', 'transfer-encoding', 'connection'):
                    self.send_header(h, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(502, 'Bad Gateway: ' + str(e))
    def serve_static_file(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            idx = os.path.join(path, 'index.html')
            if os.path.exists(idx):
                self.path = self.path.rstrip('/') + '/index.html'
            else:
                base = self.path.rstrip('/').split('?')[0]
                html_path = self.translate_path(base + '.html')
                if os.path.exists(html_path):
                    q = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
                    self.path = base + '.html' + q
                else:
                    self.send_error(404, 'File not found')
                    return
        elif not os.path.exists(path):
            # Next.js trailingSlash: false → /ko/hk/plan/ai 요청 시 ai.html 서빙
            base = self.path.rstrip('/').split('?')[0]
            html_path = self.translate_path(base + '.html')
            if os.path.exists(html_path):
                q = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
                self.path = base + '.html' + q
            else:
                self.send_error(404, 'File not found')
                return
        super().do_GET()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), ProxyHandler) as httpd:
    httpd.serve_forever()
" > ../logs/proxy.log 2>&1 &
```

---

## 3. 상태 확인 및 로그

### 프로세스 확인
```bash
ps aux | grep gunicorn
ps aux | grep "python3 -c"
```

### 포트 확인
```bash
netstat -tuln | grep -E "8001|8080"
```

### 로그 보기
```bash
tail -f /web/jiobisite/backend/logs/backend.log
tail -f /web/jiobisite/frontend/logs/proxy.log
```

---

## 4. 서버 종료

```bash
# PID 확인 후 종료
ps aux | grep gunicorn    # 백엔드 PID 확인
ps aux | grep "python3 -c"  # 프록시 PID 확인
kill [PID]

# 또는 포트로 한 번에 종료
lsof -ti:8080 | xargs kill   # 프록시 (8080)
lsof -ti:8001 | xargs kill   # 백엔드 (8001)
```

---

## 5. 참고

| 항목 | 값 |
|------|-----|
| 사용자 | `jiobi` |
| 호스트 | `jiobi.kr` 또는 `211.47.75.63` |
| 프로젝트 경로 | `/web/jiobisite` (서버에서 확인) |
| 백엔드 포트 | `8001` (내부) |
| 프록시 포트 | `8080` (가비아가 외부 80 → 8080 전달) |
| 접속 URL | `http://jiobi.kr` |
| API | `http://jiobi.kr/api/v1/...` |

연결 종료: `exit` 또는 `Ctrl + D`

---

## 6. 문제 해결

- **SSH 설치**: 설정 → 앱 → 선택적 기능 → OpenSSH 클라이언트 설치  
- **ping 테스트**: `ping jiobi.kr`  
- **호스트 키 오류**: 위 1번처럼 `HostKeyAlgorithms=+ssh-rsa` 옵션 사용
