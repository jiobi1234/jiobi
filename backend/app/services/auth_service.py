"""
인증 관련 서비스
"""

from typing import Optional, Dict, Any
from app.core.mongodb import get_database
from app.core.utils import create_access_token, verify_token
from app.core.config import settings
from app.models.auth_models import LoginRequest, SignupRequest, TokenResponse, UserResponse
from bson import ObjectId
import bcrypt
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """인증 관련 비즈니스 로직"""
    
    def __init__(self):
        self.db = get_database()
    
    async def login(self, login_data: LoginRequest) -> TokenResponse:
        """로그인 (사용자명 또는 이메일로 로그인 가능)"""
        # 사용자명 또는 이메일로 사용자 찾기
        user = self.db.users.find_one({
            "$or": [
                {"username": login_data.username},
                {"email": login_data.username}
            ]
        })
        
        if not user:
            raise ValueError("Invalid username or password")
        
        # 비밀번호 검증
        stored_password = user['password']
        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')
        if not bcrypt.checkpw(login_data.password.encode('utf-8'), stored_password):
            raise ValueError("Invalid username or password")
        
        access_token = create_access_token(data={"sub": user["email"], "user_id": str(user["_id"])})
        return TokenResponse(access_token=access_token)
    
    async def signup(self, signup_data: SignupRequest) -> TokenResponse:
        """회원가입"""
        # 이메일 중복 확인
        existing_user = self.db.users.find_one({"email": signup_data.email})
        if existing_user:
            raise ValueError("Email already registered")
        
        # 사용자명 중복 확인
        existing_username = self.db.users.find_one({"username": signup_data.username})
        if existing_username:
            raise ValueError("Username already taken")
        
        # 비밀번호 해시
        hashed_password = bcrypt.hashpw(signup_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 사용자 생성
        from datetime import datetime
        user = {
            "email": signup_data.email,
            "password": hashed_password,
            "username": signup_data.username,
            "created_at": datetime.utcnow()
        }
        
        result = self.db.users.insert_one(user)
        user["_id"] = str(result.inserted_id)
        
        access_token = create_access_token(data={"sub": user["email"], "user_id": str(user["_id"])})
        return TokenResponse(access_token=access_token)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """토큰 검증"""
        return verify_token(token)
    
    async def get_current_user(self, user_id: str) -> UserResponse:
        """현재 사용자 정보 조회"""
        try:
            user = self.db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = self.db.users.find_one({"_id": user_id})
        
        if not user:
            raise ValueError("User not found")
        
        user_email = user.get("email", "")
        is_admin = settings.ADMIN_EMAIL is not None and user_email.lower() == settings.ADMIN_EMAIL.lower()
        
        return UserResponse(
            user_id=str(user["_id"]),
            email=user.get("email", ""),
            username=user.get("username", ""),
            is_admin=is_admin,
            created_at=user.get("created_at")
        )

