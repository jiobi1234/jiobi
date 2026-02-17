import requests
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.api_client import APIClient

class TourAPI:
    """TourAPI 클라이언트"""
    
    def __init__(self):
        self.api_key = settings.TOUR_API_KEY
        self.base_url = settings.TOUR_API_BASE_URL
        self.client = APIClient()
    
    def search_places(
        self, 
        keyword: str = "", 
        page: int = 1, 
        limit: int = 10,
        region: Optional[str] = None,
        district: Optional[str] = None,
        contentTypeId: Optional[str] = None
    ) -> Dict[str, Any]:
        """장소 검색 (지역 필터링 및 카테고리 필터링 지원)"""
        if not self.api_key:
            raise ValueError("TourAPI key not configured")
        
        params = {
            "serviceKey": self.api_key,
            "pageNo": page,
            "numOfRows": limit,
            "MobileOS": "ETC",
            "MobileApp": "Jiobi",
            "_type": "json"
        }
        
        # contentTypeId가 있으면 areaBasedList 사용 (지역 기반 목록 조회)
        # KorService2에서는 엔드포인트 이름이 다를 수 있음 (areaBasedList2 또는 areaBasedList)
        # searchKeyword는 키워드가 필수이므로 빈 키워드로는 작동하지 않음
        if contentTypeId:
            # areaBasedList는 areaCode가 필수이므로 기본값으로 서울(1) 사용
            # region 파라미터가 있으면 사용, 없으면 기본값 1 (서울)
            area_code = region if region else "1"  # 기본값: 서울
            params["areaCode"] = area_code
            params["contentTypeId"] = contentTypeId
            # KorService2에서는 areaBasedList2 또는 areaBasedList 사용
            endpoint = f"{self.base_url}/areaBasedList2"
        elif keyword:
            # 키워드가 있으면 키워드 검색
            params["keyword"] = keyword
            endpoint = f"{self.base_url}/searchKeyword2"
        else:
            # 키워드도 없고 contentTypeId도 없으면 기본 검색 (서울 지역 전체)
            params["areaCode"] = "1"  # 기본값: 서울
            endpoint = f"{self.base_url}/areaBasedList2"
        
        # 디버깅: 실제 호출되는 URL 로깅
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"TourAPI 호출: {endpoint}, params: {params}")
        
        response = self.client.get(endpoint, params=params)
        
        # 에러 응답 확인 및 상세 메시지 출력
        if response.status_code != 200:
            # 응답 본문 확인 (JSON이 아닐 수 있음)
            try:
                error_data = response.json()
                error_msg = error_data.get("response", {}).get("header", {}).get("resultMsg", "Unknown error")
                error_code = error_data.get("response", {}).get("header", {}).get("resultCode", "Unknown")
                raise ValueError(f"TourAPI Error ({response.status_code}): [{error_code}] {error_msg}")
            except (ValueError, KeyError, Exception) as e:
                # JSON 파싱 실패 시 응답 텍스트 확인
                response_text = response.text[:500]  # 처음 500자만
                raise ValueError(f"TourAPI Error ({response.status_code}): Response is not JSON. Content: {response_text}")
        
        # 정상 응답 파싱
        try:
            return response.json()
        except Exception as e:
            # JSON 파싱 실패 시 응답 텍스트 확인
            response_text = response.text[:500]
            raise ValueError(f"TourAPI Response is not JSON. Content: {response_text}")
    
    def get_area_code(self, area_code: Optional[str] = None) -> Dict[str, Any]:
        """지역 코드 조회"""
        if not self.api_key:
            raise ValueError("TourAPI key not configured")
        
        params = {
            "serviceKey": self.api_key,
            "MobileOS": "ETC",
            "MobileApp": "Jiobi",
            "_type": "json"
        }
        
        if area_code:
            params["areaCode"] = area_code
        
        # KorService2에서는 areaCode2 사용
        response = self.client.get(f"{self.base_url}/areaCode2", params=params)
        response.raise_for_status()
        return response.json()
    
    def get_place_detail(self, content_id: str) -> Dict[str, Any]:
        """장소 상세 정보 조회 (contentid 기준)"""
        if not self.api_key:
            raise ValueError("TourAPI key not configured")
        
        params = {
            "serviceKey": self.api_key,
            "contentId": content_id,
            "MobileOS": "ETC",
            "MobileApp": "Jiobi",
            "_type": "json"
        }
        
        # 상세 정보 조회 (기본 정보) - KorService2에서는 detailCommon2 사용
        detail_response = self.client.get(f"{self.base_url}/detailCommon2", params=params)
        detail_response.raise_for_status()
        detail_data = detail_response.json()
        
        # 소개 정보 조회 (추가 정보) - KorService2에서는 detailIntro2 사용
        intro_params = params.copy()
        intro_params.pop("contentId", None)
        intro_params["contentId"] = content_id
        intro_params["contentTypeId"] = detail_data.get("response", {}).get("body", {}).get("items", {}).get("item", [{}])[0].get("contenttypeid", "")
        
        try:
            intro_response = self.client.get(f"{self.base_url}/detailIntro2", params=intro_params)
            intro_response.raise_for_status()
            intro_data = intro_response.json()
            
            # 두 결과 병합
            detail_item = detail_data.get("response", {}).get("body", {}).get("items", {}).get("item", [{}])[0]
            intro_item = intro_data.get("response", {}).get("body", {}).get("items", {}).get("item", [{}])[0]
            
            # 병합된 데이터 반환 (detail_item을 기준으로 intro_item의 필드 추가)
            merged_item = {**detail_item, **intro_item}
            
            # 디버깅: 병합된 데이터 로깅 (더 자세한 정보)
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"TourAPI 상세 정보 병합: contentid={merged_item.get('contentid')}, title={merged_item.get('title')}")
            logger.info(f"  - tel: {merged_item.get('tel')}")
            logger.info(f"  - homepage: {merged_item.get('homepage')}")
            logger.info(f"  - usetime: {merged_item.get('usetime')}")
            logger.info(f"  - restdate: {merged_item.get('restdate')}")
            logger.info(f"  - parking: {merged_item.get('parking')}")
            logger.info(f"  - infocenter: {merged_item.get('infocenter')}")
            logger.info(f"  - firstmenu: {merged_item.get('firstmenu')}")
            logger.info(f"  - overview: {bool(merged_item.get('overview'))}")
            
            return {
                "response": {
                    "body": {
                        "items": {
                            "item": [merged_item]
                        }
                    }
                }
            }
        except Exception as e:
            # 소개 정보 조회 실패 시 기본 정보만 반환
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"detailIntro2 조회 실패: {str(e)}, 기본 정보만 반환")
            return detail_data

