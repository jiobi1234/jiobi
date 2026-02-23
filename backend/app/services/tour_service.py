import random
from typing import Dict, Any, Optional, List
from app.api.tour_api import TourAPI
from app.api.kakao_api import KakaoAPI
from app.core.mongodb import get_database
from app.core.config import settings
from app.models.place_models import PlaceNormalizer

# 메인 화면 카테고리별 장소 조회 시 요청마다 다른 지역 사용 (다양한 결과)
# TourAPI: 공공데이터 관광 API 지역코드 (1=서울, 6=부산, 31=경기, 32=강원, 39=제주 등)
REFRESH_REGIONS_TOUR = ["1", "6", "31", "32", "39"]
# KakaoAPI: 지역명 (키워드 검색에 함께 사용)
REFRESH_REGIONS_KAKAO = ["서울", "부산", "제주", "경기", "강원"]

class TourService:
    """여행 서비스 로직"""
    
    def __init__(self):
        self.tour_api = TourAPI()
        self.kakao_api = KakaoAPI()
        self.api_provider = settings.PLACE_API_PROVIDER.lower()  # tour 또는 kakao
    
    async def refresh_section(self, section_type: str, limit: int = 6) -> Dict[str, Any]:
        """섹션 데이터 새로고침 (설정에 따라 TourAPI 또는 KakaoAPI 사용)"""
        import asyncio
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            # 설정에 따라 API 선택
            if self.api_provider == "kakao":
                return await self._refresh_section_kakao(section_type, limit, logger)
            else:
                return await self._refresh_section_tour(section_type, limit, logger)
        except Exception as e:
            logger.error(f"Error in refresh_section: {str(e)}", exc_info=True)
            raise Exception(f"Failed to refresh section: {str(e)}")
    
    async def _refresh_section_tour(self, section_type: str, limit: int, logger) -> Dict[str, Any]:
        """TourAPI를 사용한 섹션 데이터 새로고침"""
        import asyncio
        
        # 카테고리별 contentTypeId 매핑
        category_map = {
            "restaurant": "39",      # 음식점
            "shopping": "38",        # 쇼핑
            "accommodation": "32",   # 숙박
            "travel_course": "25"     # 여행코스
        }
        
        contentTypeId = category_map.get(section_type)
        
        if not contentTypeId:
            logger.warning(f"Unknown section_type: {section_type}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # 요청마다 다른 지역 사용 (같은 카테고리도 다양한 장소 노출)
        area_code = random.choice(REFRESH_REGIONS_TOUR)
        logger.info(f"[TourAPI] Fetching places for section_type={section_type}, contentTypeId={contentTypeId}, limit={limit}, areaCode={area_code}")
        
        # TourAPI를 통해 카테고리별 장소 조회
        result = await asyncio.to_thread(
            self.tour_api.search_places,
            keyword="",
            page=1,
            limit=limit,
            region=area_code,
            district=None,
            contentTypeId=contentTypeId
        )
        
        logger.info(f"TourAPI response received: {type(result)}")
        
        # 응답에서 장소 목록 추출
        if not result or not isinstance(result, dict):
            logger.warning(f"Invalid response format: {result}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # TourAPI 응답 구조: response.body.items.item
        response_data = result.get("response", {})
        if not response_data:
            logger.warning(f"No 'response' key in result: {result.keys()}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        body = response_data.get("body", {})
        if not body:
            logger.warning(f"No 'body' key in response: {response_data.keys()}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        items = body.get("items", {})
        if not items:
            logger.warning(f"No 'items' key in body: {body.keys()}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # item이 dict인 경우 (단일 항목) 또는 list인 경우
        raw_places = items.get("item", [])
        
        # 단일 항목인 경우 리스트로 변환
        if isinstance(raw_places, dict):
            raw_places = [raw_places]
        elif not isinstance(raw_places, list):
            logger.warning(f"Unexpected item type: {type(raw_places)}")
            raw_places = []
        
        # TourAPI 응답을 Place 모델로 변환 (이미지 필드 포함)
        places = []
        for item in raw_places:
            try:
                place = PlaceNormalizer.from_tour_api(item)
                places.append(place.to_dict())
            except Exception as e:
                logger.warning(f"Failed to normalize place: {e}, item: {item}")
                continue
        
        logger.info(f"Extracted {len(places)} places (normalized)")
        
        return {
            "section_type": section_type,
            "places": places,
            "count": len(places)
        }
    
    async def _refresh_section_kakao(self, section_type: str, limit: int, logger) -> Dict[str, Any]:
        """KakaoAPI를 사용한 섹션 데이터 새로고침"""
        import asyncio
        
        # 카테고리별 키워드 매핑 (KakaoAPI는 키워드 검색 사용)
        category_keywords = {
            "restaurant": "음식점",      # 음식점
            "shopping": "쇼핑",          # 쇼핑
            "accommodation": "숙박",     # 숙박
            "travel_course": "관광지"    # 여행코스
        }
        
        keyword = category_keywords.get(section_type)
        
        if not keyword:
            logger.warning(f"Unknown section_type: {section_type}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # 요청마다 다른 지역 사용 (같은 카테고리도 다양한 장소 노출)
        region = random.choice(REFRESH_REGIONS_KAKAO)
        logger.info(f"[KakaoAPI] Fetching places for section_type={section_type}, keyword={keyword}, limit={limit}, region={region}")
        
        # KakaoAPI를 통해 카테고리별 장소 조회
        result = await asyncio.to_thread(
            self.kakao_api.search_places,
            keyword=keyword,
            page=1,
            limit=limit,
            region=region,
            district=None
        )
        
        logger.info(f"KakaoAPI response received: {type(result)}")
        
        # 응답에서 장소 목록 추출
        if not result or not isinstance(result, dict):
            logger.warning(f"Invalid response format: {result}")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # KakaoAPI 응답 구조: documents
        documents = result.get("documents", [])
        
        if not documents:
            logger.warning(f"No 'documents' key in result or empty documents")
            return {
                "section_type": section_type,
                "places": [],
                "count": 0
            }
        
        # KakaoAPI 응답을 Place 모델로 변환
        places = []
        for item in documents:
            try:
                place = PlaceNormalizer.from_kakao_api(item)
                places.append(place.to_dict())
            except Exception as e:
                logger.warning(f"Failed to normalize place: {e}, item: {item}")
                continue
        
        logger.info(f"Extracted {len(places)} places (normalized)")
        
        return {
            "section_type": section_type,
            "places": places,
            "count": len(places)
        }
    
    async def get_popular_places(self, limit: int = 6) -> List[Dict[str, Any]]:
        """인기 장소 조회"""
        # 실제 구현은 TourAPI나 다른 소스를 사용
        return []
    
    async def get_theme_places(self, theme_name: str, page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """테마별 장소 조회"""
        try:
            # TourAPI를 통해 테마별 장소 조회
            result = self.tour_api.search_places(theme_name, page, limit)
            return {
                "theme": theme_name,
                "places": result.get("response", {}).get("body", {}).get("items", {}).get("item", []),
                "page": page,
                "limit": limit
            }
        except Exception as e:
            raise Exception(f"Failed to get theme places: {str(e)}")
    
    async def create_plan(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """여행 계획 생성"""
        from datetime import datetime
        db = get_database()
        plan_data["created_at"] = datetime.utcnow()
        result = db.plans.insert_one(plan_data)
        plan_data["_id"] = str(result.inserted_id)
        return plan_data

    async def update_plan(self, plan_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """여행 계획 수정"""
        from bson import ObjectId
        from datetime import datetime

        db = get_database()
        try:
            update_data = plan_data.copy()
            update_data["updated_at"] = datetime.utcnow()

            result = db.plans.find_one_and_update(
                {"_id": ObjectId(plan_id)},
                {"$set": update_data},
                return_document=True,
            )
            if not result:
                raise ValueError("Plan not found")
            result["_id"] = str(result["_id"])
            return result
        except Exception as e:
            raise Exception(f"Failed to update plan: {str(e)}")
    
    async def get_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """여행 계획 조회"""
        from bson import ObjectId
        db = get_database()
        try:
            plan = db.plans.find_one({"_id": ObjectId(plan_id)})
            if plan:
                plan["_id"] = str(plan["_id"])
            return plan
        except:
            return None

    async def delete_plan(self, plan_id: str) -> Dict[str, Any]:
        """여행 계획 삭제"""
        from bson import ObjectId
        db = get_database()
        try:
            result = db.plans.delete_one({"_id": ObjectId(plan_id)})
            return {
                "success": result.deleted_count > 0,
                "deleted_count": result.deleted_count,
            }
        except Exception as e:
            raise Exception(f"Failed to delete plan: {str(e)}")
    
    async def get_user_plans(self, user_id: Optional[str], page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """사용자 여행 계획 목록"""
        db = get_database()
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        skip = (page - 1) * limit
        plans = list(db.plans.find(query).skip(skip).limit(limit))
        total = db.plans.count_documents(query)
        
        for plan in plans:
            plan["_id"] = str(plan["_id"])
        
        return {
            "plans": plans,
            "page": page,
            "limit": limit,
            "total": total
        }

    async def search_keyword_for_logistics(self, keyword: str, region: str = None) -> Optional[Dict[str, Any]]:
        """
        LogisticsService용 단순 검색 메서드.
        키워드로 검색하여 가장 정확도 높은 1개의 장소(좌표 포함)를 반환.
        region이 있으면 해당 지역 기준으로 검색 (예: 강릉 중앙시장).
        TourAPI 우선, 결과 없으면 Kakao 로컬 API로 fallback.
        """
        import asyncio
        import logging
        logger = logging.getLogger(__name__)

        # 검색 키워드는 장소명만 사용 (region 합치지 않음 - API 검색 성공률 향상)
        search_keyword = (keyword or "").strip()

        # 1) TourAPI 우선 시도
        try:
            result = await asyncio.to_thread(
                self.tour_api.search_places,
                keyword=search_keyword,
                page=1,
                limit=1,
                region=None,
                district=None,
                contentTypeId=None,
            )
            if result and isinstance(result, dict):
                response_data = result.get("response", {})
                body = response_data.get("body", {})
                items = body.get("items", {})
                if isinstance(items, str):
                    items = {}
                raw_places = items.get("item", [])
                if isinstance(raw_places, dict):
                    raw_places = [raw_places]
                if raw_places:
                    place = PlaceNormalizer.from_tour_api(raw_places[0])
                    return place.to_dict()
        except Exception as e:
            logger.warning(f"Logistics search (TourAPI) failed for {search_keyword}: {e}")

        # 2) Fallback: Kakao 로컬 API
        try:
            if not self.kakao_api.api_key:
                return None
            kakao_result = await asyncio.to_thread(
                self.kakao_api.search_places,
                keyword=search_keyword,
                page=1,
                limit=1,
            )
            docs = (kakao_result or {}).get("documents", [])
            if docs:
                place = PlaceNormalizer.from_kakao_api(docs[0])
                d = place.to_dict()
                logger.info(f"Logistics: Kakao fallback used for {search_keyword}")
                return d
        except Exception as e:
            logger.warning(f"Logistics search (Kakao fallback) failed for {keyword}: {e}")

        return None

