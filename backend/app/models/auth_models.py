"""
인증 관련 모델
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """로그인 요청 모델"""
    username: str  # 사용자명 또는 이메일
    password: str


class SignupRequest(BaseModel):
    """회원가입 요청 모델"""
    email: EmailStr
    password: str
    username: str


class TokenResponse(BaseModel):
    """토큰 응답 모델"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """사용자 응답 모델"""
    user_id: str
    email: str
    username: str
    is_admin: bool = False
    created_at: Optional[datetime] = None

