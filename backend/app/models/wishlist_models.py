"""
위시리스트(Wishlist) 관련 모델
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class WishlistItem(BaseModel):
  """위시리스트에 저장된 단일 장소"""

  id: str
  place_id: str
  title: str
  address: Optional[str] = None
  image: Optional[str] = None
  created_at: datetime


class WishlistCreateRequest(BaseModel):
  """위시리스트 추가 요청 모델"""

  place_id: str
  title: str
  address: Optional[str] = None
  image: Optional[str] = None


class WishlistListResponse(BaseModel):
  """위시리스트 목록 응답 모델"""

  items: List[WishlistItem]

