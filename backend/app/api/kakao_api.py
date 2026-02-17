import requests
from typing import Dict, Any, Optional, List, Tuple
from app.core.config import settings
from app.core.api_client import APIClient

class KakaoAPI:
    """Kakao API 클라이언트"""
    
    def __init__(self):
        self.api_key = settings.KAKAO_REST_API_KEY
        self.base_url = settings.KAKAO_API_BASE_URL
        self.mobility_api_key = settings.KAKAO_MOBILITY_REST_API_KEY or settings.KAKAO_REST_API_KEY
        self.mobility_base_url = settings.KAKAO_MOBILITY_API_BASE_URL
        self.client = APIClient()
    
    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("Kakao API key not configured")
        return {
            "Authorization": f"KakaoAK {self.api_key}"
        }
    
    def search_places(
        self, 
        keyword: str = "", 
        page: int = 1, 
        limit: int = 10,
        region: Optional[str] = None,
        district: Optional[str] = None
    ) -> Dict[str, Any]:
        """키워드 기반 장소 검색 (지역 필터링 지원)"""
        headers = self._get_headers()
        
        # 쿼리 구성: 키워드 + 지역
        query_parts = []
        if keyword:
            query_parts.append(keyword)
        if region:
            query_parts.append(region)
        if district:
            query_parts.append(district)
        
        params = {
            "query": " ".join(query_parts) if query_parts else "서울",
            "page": page,
            "size": limit
        }
        
        response = self.client.get(f"{self.base_url}/local/search/keyword.json", params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def search_accommodation_near(
        self,
        lat: float,
        lng: float,
        radius: int = 5000,
        page: int = 1,
        limit: int = 5,
    ) -> Dict[str, Any]:
        """
        좌표 주변 숙소 검색 (카테고리 코드 AD5).
        lat, lng: 위도/경도 (y/x)
        radius: 검색 반경 (미터, 최대 20000)
        """
        headers = self._get_headers()
        
        params = {
            "category_group_code": "AD5",  # 숙박
            "y": lat,
            "x": lng,
            "radius": radius,
            "page": page,
            "size": limit,
        }
        
        response = self.client.get(f"{self.base_url}/local/search/category.json", params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def get_place_detail(self, place_id: str) -> Dict[str, Any]:
        """장소 상세 정보 (place_id로 직접 조회 시도)"""
        headers = self._get_headers()
        
        # 카카오 로컬 API는 place_id로 직접 조회하는 엔드포인트가 없으므로
        # 키워드 검색으로 시도하되, 정확한 매칭을 위해 여러 방법 시도
        try:
            response = self.client.get(
                f"{self.base_url}/local/search/keyword.json", 
                params={"query": place_id, "size": 1}, 
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("documents"):
                # place_id와 일치하는 결과 찾기
                for doc in data.get("documents", []):
                    if doc.get("id") == place_id:
                        return doc
                # 일치하는 것이 없으면 첫 번째 결과 반환
                return data["documents"][0]
        except Exception:
            # 검색 실패 시 빈 객체 반환
            pass
        
        return {}

    # -----------------------------
    # 길찾기 (Kakao 모빌리티 Directions)
    # -----------------------------
    def _get_mobility_headers(self) -> Dict[str, str]:
        """
        Kakao 모빌리티 API 헤더 생성.
        별도 Mobility 키가 없으면 일반 REST 키를 재사용합니다.
        """
        if not self.mobility_api_key:
            raise ValueError("Kakao Mobility API key not configured")
        return {
            "Authorization": f"KakaoAK {self.mobility_api_key}"
        }

    def get_directions(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: Optional[List[Tuple[float, float]]] = None,
        priority: str = "RECOMMEND",
    ) -> Dict[str, Any]:
        """
        Kakao 모빌리티 길찾기 API (자동차 경로)
        - origin, destination, waypoints: (lng, lat) 튜플 목록 (Kakao 좌표계 기준)
        """
        headers = self._get_mobility_headers()
        
        origin_param = f"{origin[0]},{origin[1]}"
        destination_param = f"{destination[0]},{destination[1]}"
        
        params: Dict[str, Any] = {
            "origin": origin_param,
            "destination": destination_param,
            "priority": priority,
        }
        
        if waypoints:
            # Kakao 모빌리티: waypoints=x1,y1|x2,y2 형식
            waypoint_str = "|".join(f"{wp[0]},{wp[1]}" for wp in waypoints)
            params["waypoints"] = waypoint_str
        
        response = self.client.get(
            f"{self.mobility_base_url}/directions",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()

