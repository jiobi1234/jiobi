"""
Google Places API 래퍼
- 장소명(+선택적으로 좌표)를 기준으로 Google Places 정보를 조회
- 평점/리뷰 수 등을 반환하여 품질 판단 및 표시용으로 사용
"""

from __future__ import annotations

import re
from typing import Optional, Dict, Any
from urllib.parse import urlencode
from urllib import request as urlrequest
import json
import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


def normalize_place_name_for_google(raw_name: str) -> str:
    """
    구글 검색 매칭률 향상을 위해 장소명 전처리.
    - 괄호 및 괄호 안 내용 제거: "순천만습지(습지공원)" -> "순천만습지"
    - 끝의 지점/본점/호점 등 제거: "스타벅스 여수해양공원점(본점)" -> "스타벅스 여수해양공원"
    - 앞뒤 공백 제거, 길이 제한(50자)
    """
    if not raw_name or not isinstance(raw_name, str):
        return ""
    s = raw_name.strip()
    # 괄호와 괄호 안 내용 제거
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)
    # 끝의 "점", "본점", "1호점" 등 제거 (공백 있을 수 있음)
    s = re.sub(r"\s*점\s*$", "", s)
    s = re.sub(r"\s*본점\s*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*\d+호점\s*$", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > 50:
        s = s[:50].rstrip()
    return s


class GooglePlacesService:
    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    def __init__(self) -> None:
        self.api_key: Optional[str] = settings.GOOGLE_PLACES_API_KEY
        if not self.api_key:
            logger.info("GOOGLE_PLACES_API_KEY is not set. Google Places enrichment will be disabled.")

    def _request(self, path: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            return None

        params_with_key = {**params, "key": self.api_key}
        qs = urlencode(params_with_key)
        url = f"{self.BASE_URL}{path}?{qs}"

        try:
            req = urlrequest.Request(url)
            with urlrequest.urlopen(req, timeout=5) as resp:
                data = resp.read().decode("utf-8")
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Google Places request failed: {e}")
            return None

    def search_place(
        self,
        name: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        region: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        장소명(+선택 좌표)으로 Google Places를 조회하고
        place_id, rating, user_ratings_total, 대표 사진 1장 등을 반환.
        이름은 normalize_place_name_for_google로 정제 후 요청해 매칭률 향상.
        """
        normalized_name = normalize_place_name_for_google(name)
        if not normalized_name:
            return None

        params: Dict[str, Any] = {
            "input": normalized_name,
            "inputtype": "textquery",
            "fields": "place_id,name,rating,user_ratings_total,geometry,photos",
        }

        if lat is not None and lng is not None:
            params["locationbias"] = f"point:{lat},{lng}"

        data = self._request("/findplacefromtext/json", params)
        if not data:
            return None

        status = data.get("status")
        candidates = data.get("candidates") or []
        if status != "OK" or not candidates:
            return None

        cand = candidates[0]
        out: Dict[str, Any] = {
            "place_id": cand.get("place_id"),
            "name": cand.get("name"),
            "rating": cand.get("rating"),
            "user_ratings_total": cand.get("user_ratings_total"),
        }

        # 대표 사진 1장 URL 생성 (프리패치용)
        photos_raw = cand.get("photos") or []
        if photos_raw and self.api_key:
            ref = photos_raw[0].get("photo_reference")
            if ref:
                url = f"{self.BASE_URL}/photo?maxwidth=800&photo_reference={ref}&key={self.api_key}"
                out["google_photos"] = [{"url": url}]
        return out

    def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Google Place Details API 호출.
        - 별점/리뷰/영업시간 등의 상세 정보를 반환.
        """
        if not place_id:
            return None

        params = {
            "place_id": place_id,
            "fields": "place_id,name,formatted_address,formatted_phone_number,geometry,website,types,rating,user_ratings_total,opening_hours,reviews,photos",
            "language": "ko",
        }
        data = self._request("/details/json", params)
        if not data:
            return None

        if data.get("status") != "OK":
            return None

        result = data.get("result") or {}

        photos_raw = result.get("photos") or []
        photos: list[dict[str, Any]] = []
        for p in photos_raw:
            ref = p.get("photo_reference")
            if not ref:
                continue
            # 서버에서 완성된 URL을 만들어 프론트에서는 바로 사용하도록 함
            url = f"{self.BASE_URL}/photo?maxwidth=1600&photo_reference={ref}&key={self.api_key}"
            photos.append({
                "url": url,
                "width": p.get("width"),
                "height": p.get("height"),
            })

        location = (result.get("geometry") or {}).get("location") or {}

        return {
            "place_id": result.get("place_id"),
            "name": result.get("name"),
            "formatted_address": result.get("formatted_address"),
            "formatted_phone_number": result.get("formatted_phone_number"),
            "location": location,
            "website": result.get("website"),
            "types": result.get("types"),
            "rating": result.get("rating"),
            "user_ratings_total": result.get("user_ratings_total"),
            "opening_hours": result.get("opening_hours"),
            "reviews": result.get("reviews"),
            "photos": photos,
        }


google_places_service = GooglePlacesService()

