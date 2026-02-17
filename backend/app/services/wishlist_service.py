from datetime import datetime
from typing import Dict, Any, List

from app.core.mongodb import get_database


class WishlistService:
  """위시리스트 관련 서비스"""

  def __init__(self) -> None:
    db = get_database()
    self.collection = db.wishlists

  async def add_to_wishlist(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """위시리스트에 장소 추가 (이미 있으면 업데이트, 없으면 생성)"""
    now = datetime.utcnow()

    doc = {
      "user_id": user_id,
      "place_id": data.get("place_id"),
      "title": data.get("title"),
      "address": data.get("address"),
      "image": data.get("image"),
      "updated_at": now,
    }

    # 최초 추가 시 created_at 설정
    existing = self.collection.find_one(
      {"user_id": user_id, "place_id": data.get("place_id")}
    )
    if not existing:
      doc["created_at"] = now

    self.collection.update_one(
      {"user_id": user_id, "place_id": data.get("place_id")},
      {"$set": doc},
      upsert=True,
    )

    result = self.collection.find_one({"user_id": user_id, "place_id": data.get("place_id")})
    if not result:
      raise ValueError("Failed to save wishlist item")

    # ObjectId를 문자열로 변환
    result["id"] = str(result.pop("_id"))
    return result

  async def remove_from_wishlist(self, user_id: str, place_id: str) -> Dict[str, Any]:
    """위시리스트에서 장소 제거"""
    delete_result = self.collection.delete_one(
      {"user_id": user_id, "place_id": place_id}
    )
    return {
      "success": delete_result.deleted_count > 0,
      "deleted_count": delete_result.deleted_count,
    }

  async def get_wishlist(self, user_id: str) -> List[Dict[str, Any]]:
    """사용자 위시리스트 조회 (최근 추가 순)"""
    cursor = (
      self.collection.find({"user_id": user_id})
      .sort("created_at", -1)
    )
    items: List[Dict[str, Any]] = []
    for doc in cursor:
      doc["id"] = str(doc.pop("_id"))
      items.append(doc)
    return items

