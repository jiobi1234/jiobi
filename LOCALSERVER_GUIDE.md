## 로컬 서버 실행 가이드 (Windows, jiobisite)

### 1. 프론트엔드 실행 (Next.js)

```powershell
cd frontend
npm install        # 최초 1번만
npm run dev        # http://localhost:3000
```

### 2. 백엔드 실행 (FastAPI + Uvicorn)

```powershell
cd backend
.\venv\Scripts\Activate.ps1   # 가상환경 활성화
venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- 브라우저에서 API 문서: `http://localhost:8000/docs`
- 프론트에서 백엔드 호출 기본 주소는 `.env` 설정에 따릅니다.

### 3. Watchpack `pagefile.sys` 에러 메시지 (Windows)

`npm run dev` 시 터미널에 `Watchpack Error ... lstat 'D:\pagefile.sys'` 가 반복해서 나올 수 있습니다.  
**동작에는 영향 없으며**, Next.js가 D: 드라이브 루트를 스캔하다 나는 알려진 현상입니다.

- **무시해도 됨** – 서버/페이지는 정상 동작합니다.
- CMD에서 `findstr`로 파이프하면 쓰기 오류가 날 수 있으므로, 그냥 `npm run dev`만 실행하고 위 메시지는 무시하세요.
- 메시지를 숨기고 싶다면 PowerShell에서:  
  `npm run dev 2>&1 | Where-Object { $_ -notmatch 'pagefile' }`