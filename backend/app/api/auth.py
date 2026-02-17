from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.utils import verify_token
from app.services.auth_service import AuthService
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

