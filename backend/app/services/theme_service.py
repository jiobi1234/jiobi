"""
테마 관련 서비스
"""

from typing import List, Optional, Dict, Any
from app.core.mongodb import get_database
from app.core.config import settings
from app.models.theme_models import (
    CreateThemeRequest, 
    UpdateThemeRequest, 
    ThemeResponse, 
    ThemesResponse
)
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ThemeService:
    """테마 관련 비즈니스 로직"""
    
    def __init__(self):
        self.db = get_database()
    
    def _is_admin(self, user_email: str) -> bool:
        """관리자 여부 확인"""
        return settings.ADMIN_EMAIL is not None and user_email.lower() == settings.ADMIN_EMAIL.lower()
    
    async def create_theme(self, theme_data: CreateThemeRequest, user_email: str) -> ThemeResponse:
        """테마 생성 (관리자만)"""
        if not self._is_admin(user_email):
            raise PermissionError("관리자만 접근 가능합니다.")
        
        # 테마 생성
        theme = {
            "name_ko": theme_data.name_ko,
            "name_en": theme_data.name_en,
            "places": [place.dict() for place in theme_data.places],
            "created_at": datetime.utcnow()
        }
        
        result = self.db.themes.insert_one(theme)
        
        return ThemeResponse(
            id=str(result.inserted_id),
            name_ko=theme["name_ko"],
            name_en=theme["name_en"],
            places=theme_data.places,
            created_at=theme["created_at"]
        )
    
    async def get_themes(self) -> ThemesResponse:
        """테마 목록 조회"""
        themes = list(self.db.themes.find().sort("created_at", -1))
        
        result = []
        for theme in themes:
            from app.models.theme_models import ThemePlace
            theme_places = [
                ThemePlace(**place) if isinstance(place, dict) else place
                for place in theme.get("places", [])
            ]
            result.append(ThemeResponse(
                id=str(theme["_id"]),
                name_ko=theme.get("name_ko", ""),
                name_en=theme.get("name_en", ""),
                places=theme_places,
                created_at=theme.get("created_at")
            ))
        
        return ThemesResponse(themes=result)
    
    async def get_theme(self, theme_id: str) -> ThemeResponse:
        """특정 테마 조회"""
        try:
            theme = self.db.themes.find_one({"_id": ObjectId(theme_id)})
        except Exception:
            theme = self.db.themes.find_one({"_id": theme_id})
        
        if not theme:
            raise ValueError("Theme not found")
        
        from app.models.theme_models import ThemePlace
        theme_places = [
            ThemePlace(**place) if isinstance(place, dict) else place
            for place in theme.get("places", [])
        ]
        
        return ThemeResponse(
            id=str(theme["_id"]),
            name_ko=theme.get("name_ko", ""),
            name_en=theme.get("name_en", ""),
            places=theme_places,
            created_at=theme.get("created_at")
        )
    
    async def update_theme(
        self, 
        theme_id: str, 
        theme_data: UpdateThemeRequest, 
        user_email: str
    ) -> Dict[str, Any]:
        """테마 수정 (관리자만)"""
        if not self._is_admin(user_email):
            raise PermissionError("관리자만 접근 가능합니다.")
        
        update_fields = {}
        if theme_data.name_ko is not None:
            update_fields["name_ko"] = theme_data.name_ko
        if theme_data.name_en is not None:
            update_fields["name_en"] = theme_data.name_en
        if theme_data.places is not None:
            update_fields["places"] = [place.dict() for place in theme_data.places]
        
        if not update_fields:
            raise ValueError("수정할 내용이 없습니다.")
        
        try:
            result = self.db.themes.update_one(
                {"_id": ObjectId(theme_id)},
                {"$set": update_fields}
            )
        except Exception:
            result = self.db.themes.update_one(
                {"_id": theme_id},
                {"$set": update_fields}
            )
        
        if result.matched_count == 0:
            raise ValueError("Theme not found")
        
        return {"success": True}
    
    async def delete_theme(self, theme_id: str, user_email: str) -> Dict[str, Any]:
        """테마 삭제 (관리자만)"""
        if not self._is_admin(user_email):
            raise PermissionError("관리자만 접근 가능합니다.")
        
        try:
            result = self.db.themes.delete_one({"_id": ObjectId(theme_id)})
        except Exception:
            result = self.db.themes.delete_one({"_id": theme_id})
        
        if result.deleted_count == 0:
            raise ValueError("Theme not found")
        
        return {"success": True}

