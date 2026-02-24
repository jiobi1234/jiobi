"""
Google OAuth2 로그인/회원가입 서비스 모듈
"""

from __future__ import annotations

import base64
import json
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
from urllib.parse import urlencode
from urllib import request as urlrequest

from bson import ObjectId

from app.core.config import settings
from app.core.mongodb import get_database
from app.core.utils import create_access_token


class GoogleOAuthService:
    """Google OAuth2 관련 로직을 담당하는 서비스."""

    AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def __init__(self):
        self.db = get_database()

    def _ensure_config(self) -> None:
        if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
            raise ValueError("Google OAuth 환경변수(GOOGLE_OAUTH_CLIENT_ID / SECRET)가 설정되지 않았습니다.")
        if not settings.GOOGLE_OAUTH_REDIRECT_URI:
            raise ValueError("Google OAuth 리디렉트 URI(GOOGLE_OAUTH_REDIRECT_URI)가 설정되지 않았습니다.")

    def _encode_state(self, next_url: Optional[str]) -> str:
        payload: Dict[str, Any] = {}
        if next_url:
            payload["next"] = next_url
        raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        return base64.urlsafe_b64encode(raw).decode("utf-8")

    def _decode_state(self, state: Optional[str]) -> Dict[str, Any]:
        if not state:
            return {}
        try:
            raw = base64.urlsafe_b64decode(state.encode("utf-8"))
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def build_authorization_url(self, next_url: Optional[str]) -> str:
        """구글 인증 페이지 URL 생성."""
        self._ensure_config()

        params = {
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "include_granted_scopes": "true",
            "state": self._encode_state(next_url),
            "prompt": "select_account",
        }
        return f"{self.AUTH_BASE_URL}?{urlencode(params)}"

    def _post_form(self, url: str, data: Dict[str, Any]) -> Dict[str, Any]:
        body = urlencode(data).encode("utf-8")
        req = urlrequest.Request(
            url,
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        with urlrequest.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _get_json(self, url: str, headers: Dict[str, str]) -> Dict[str, Any]:
        req = urlrequest.Request(url, headers=headers)
        with urlrequest.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """인증 코드로 액세스 토큰/ID 토큰 교환."""
        self._ensure_config()

        data = {
            "code": code,
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        return self._post_form(self.TOKEN_URL, data)

    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """액세스 토큰으로 구글 사용자 정보 조회."""
        headers = {"Authorization": f"Bearer {access_token}"}
        return self._get_json(self.USERINFO_URL, headers)

    def login_or_signup_google(self, user_info: Dict[str, Any]) -> str:
        """
        구글 사용자 정보로 로그인 또는 회원가입 처리 후 JWT 반환.
        """
        sub = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name") or (email.split("@")[0] if email else "user")

        if not sub or not email:
            raise ValueError("Google user info에 sub 또는 email이 없습니다.")

        users = self.db.users

        # 1) provider+provider_id로 우선 조회
        user = users.find_one({"provider": "google", "provider_id": sub})

        # 2) 없으면 이메일로 조회
        if not user:
            user = users.find_one({"email": email})

        # 3) 아예 없으면 새로 생성 (구글 회원가입)
        if not user:
            user = {
                "email": email,
                "username": name,
                "provider": "google",
                "provider_id": sub,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            result = users.insert_one(user)
            user["_id"] = result.inserted_id
        else:
            # 기존 유저에 provider 정보 보강
            update_fields: Dict[str, Any] = {
                "provider": user.get("provider") or "google",
                "updated_at": datetime.utcnow(),
            }
            if not user.get("provider_id"):
                update_fields["provider_id"] = sub
            users.update_one({"_id": user["_id"]}, {"$set": update_fields})

        user_id = str(user["_id"]) if isinstance(user["_id"], ObjectId) else user["_id"]
        token = create_access_token({"sub": email, "user_id": user_id})
        return token

    def handle_callback(self, code: str, state: Optional[str]) -> Tuple[str, Optional[str]]:
        """
        구글 콜백 처리: 토큰 교환, 유저 조회/생성, JWT 생성 및 next URL 반환.
        """
        tokens = self.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        if not access_token:
            raise ValueError("Google 토큰 응답에 access_token이 없습니다.")

        user_info = self.get_user_info(access_token)
        jwt_token = self.login_or_signup_google(user_info)

        state_data = self._decode_state(state)
        next_url = state_data.get("next")

        return jwt_token, next_url


google_oauth_service = GoogleOAuthService()

