"""
테마 관련 모델
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ThemePlace(BaseModel):
    """테마 장소 모델"""
    place_id: str
    title: str
    address: Optional[str] = None
    image: Optional[str] = None


class CreateThemeRequest(BaseModel):
    """테마 생성 요청 모델"""
    name_ko: str  # 한국어 테마 이름
    name_en: str  # 영어 테마 이름
    places: List[ThemePlace]


class UpdateThemeRequest(BaseModel):
    """테마 수정 요청 모델"""
    name_ko: Optional[str] = None
    name_en: Optional[str] = None
    places: Optional[List[ThemePlace]] = None


class ThemeResponse(BaseModel):
    """테마 응답 모델"""
    id: str
    name_ko: str
    name_en: str
    places: List[ThemePlace]
    created_at: datetime


class ThemesResponse(BaseModel):
    """테마 목록 응답 모델"""
    themes: List[ThemeResponse]

