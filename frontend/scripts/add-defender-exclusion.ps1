# Windows Defender 제외 추가 (Next.js UNKNOWN -4094 오류 방지)
# 관리자 권한으로 한 번만 실행하면 됩니다.
#
# 사용법: PowerShell을 "관리자 권한으로 실행" 후
#   cd d:\jiobi\frontend\scripts
#   .\add-defender-exclusion.ps1

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nextDir = Join-Path $projectRoot ".next"
$cacheDir = Join-Path $projectRoot "node_modules\.cache"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

$pathsToAdd = @($projectRoot)
if (Test-Path $nextDir) { $pathsToAdd += $nextDir }
if (Test-Path $cacheDir) { $pathsToAdd += $cacheDir }
if ($nodePath) { $pathsToAdd += $nodePath }

Write-Host "Next.js UNKNOWN(-4094) 방지를 위해 Windows Defender 제외를 추가합니다." -ForegroundColor Cyan
Write-Host ""

foreach ($path in $pathsToAdd) {
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction Stop
        Write-Host "[OK] $path" -ForegroundColor Green
    } catch {
        Write-Host "[SKIP] $path - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "완료. 이제 'npm run dev' 시 캐시 삭제 없이 사용해 보세요." -ForegroundColor Cyan
Write-Host "제거가 필요하면: Windows 설정 > 개인정보 및 보안 > Windows 보안 > 바이러스 및 위협 방지 > 설정 관리 > 제외" -ForegroundColor Gray
