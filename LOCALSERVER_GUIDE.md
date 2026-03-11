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

uvicorn app.main:app `
  --reload `
  --host 0.0.0.0 `
  --port 8000
```

- 브라우저에서 API 문서: `http://localhost:8000/docs`
- 프론트에서 백엔드 호출 기본 주소는 `.env` 설정에 따릅니다.