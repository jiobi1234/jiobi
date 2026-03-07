# Windows에서 개발 시 참고

## UNKNOWN 오류(-4094)가 날 때

Next.js `npm run dev` 중에 `.next` 또는 `webpack.js` 열기 실패(UNKNOWN -4094)가 나면, **Windows Defender/백신이 파일을 잠그는 것**이 원인인 경우가 많습니다.

### 이미 적용된 조치

- **개발 시 빌드 캐시 위치 변경**: `next.config.js`에서 개발 모드일 때만 `distDir`를 `node_modules/.cache/next`로 두어, 백신이 덜 건드리는 경로에 캐시가 쌓이도록 했습니다.  
  → 매번 `.next`를 지울 필요 없이, 같은 현상이 크게 줄어들 수 있습니다.

### 그래도 오류가 반복되면 (한 번만 설정)

1. **Windows Defender 제외 추가**  
   - **방법 A (스크립트)**  
     PowerShell을 **관리자 권한으로 실행**한 뒤:
     ```powershell
     cd d:\jiobi\frontend\scripts
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     .\add-defender-exclusion.ps1
     ```
   - **방법 B (수동)**  
     - Windows 설정 → 개인정보 및 보안 → Windows 보안 → 바이러스 및 위협 방지 → 설정 관리 → 제외 추가  
     - **프로세스**: `node.exe` (경로: 보통 `C:\Program Files\nodejs\node.exe`)  
     - **폴더**: `d:\jiobi\frontend` 또는 `d:\jiobi\frontend\node_modules\.cache`

2. **OneDrive**로 프로젝트를 동기화 중이면, `d:\jiobi\frontend\.next`와 `node_modules`는 동기화 제외를 권장합니다.

이렇게 한 번 설정해 두면, 이후에는 캐시를 지우지 않고도 개발이 가능한 경우가 많습니다.
