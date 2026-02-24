from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse, HTMLResponse
from app.core.utils import verify_token
from app.services.auth_service import AuthService
from app.services.google_oauth_service import google_oauth_service
from app.models.auth_models import LoginRequest, SignupRequest, TokenResponse, UserResponse

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 사용자 가져오기 (의존성 주입용)"""
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """로그인 (사용자명 또는 이메일로 로그인 가능)"""
    try:
        return await auth_service.login(login_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signup", response_model=TokenResponse)
async def signup(signup_data: SignupRequest):
    """회원가입"""
    try:
        return await auth_service.signup(signup_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 로그인한 사용자 정보 조회"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return await auth_service.get_current_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google/login")
async def google_login(next: str | None = Query(default=None, description="로그인 후 이동할 경로")):
    """
    Google OAuth2 로그인 시작 엔드포인트.
    프론트에서 /api/v1/auth/google/login?next=/ko/hk/mytravel 형태로 호출.
    """
    try:
        authorization_url = google_oauth_service.build_authorization_url(next)
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google/callback", response_class=HTMLResponse)
async def google_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    """
    Google OAuth2 콜백 엔드포인트.
    - code/state를 받아 토큰 교환 및 유저 생성/로그인 처리
    - JWT를 localStorage에 저장하는 간단한 HTML/JS를 반환
    """
    if error:
        content = f"<html><body><h3>Google 로그인 오류</h3><p>{error}</p></body></html>"
        return HTMLResponse(content=content, status_code=400)

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        jwt_token, next_url = google_oauth_service.handle_callback(code, state)
    except Exception as e:
        content = f"<html><body><h3>Google 로그인 처리 중 오류가 발생했습니다.</h3><p>{str(e)}</p></body></html>"
        return HTMLResponse(content=content, status_code=500)

    # 기본 이동 경로 (locale이 없을 때를 대비하여 /ko/hk 사용)
    redirect_target = next_url or "/ko/hk"

    # 프론트에서 사용하는 토큰 키는 API_CONFIG.tokenKey (현재 'jiobi_access_token')
    html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Google 로그인 완료</title>
  </head>
  <body>
    <p>로그인 처리 중입니다. 잠시만 기다려주세요...</p>
    <script>
      (function() {{
        try {{
          localStorage.setItem('jiobi_access_token', '{jwt_token}');
        }} catch (e) {{}}
        window.location.href = '{redirect_target}';
      }})();
    </script>
  </body>
</html>
"""
    return HTMLResponse(content=html)

