import random
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.api.tour_api import TourAPI
from app.api.kakao_api import KakaoAPI
from app.core.mongodb import get_database
from app.core.config import settings
from app.models.place_models import PlaceNormalizer
from app.services.google_places_service import google_places_service, normalize_place_name_for_google

# 메인 화면 카테고리별 장소 조회 시 요청마다 다른 지역 사용 (다양한 결과)
# TourAPI: 공공데이터 관광 API 지역코드 (1=서울, 6=부산, 31=경기, 32=강원, 39=제주 등)
REFRESH_REGIONS_TOUR = ["1", "6", "31", "32", "39"]
# KakaoAPI: 지역명 (키워드 검색에 함께 사용)
REFRESH_REGIONS_KAKAO = ["서울", "부산", "제주", "경기", "강원"]

# 메인 HOT 섹션용 Featured place_id 목록 (우선은 비워두고 추후 채움)
FEATURED_PLACE_IDS: Dict[str, List[str]] = {
    # 예: "restaurant": ["place_id_1", "place_id_2", ...]
    "restaurant": [],
    "shopping": [],
    "accommodation": [],
    "travel_course": [],
}

class TourService:
    """여행 서비스 로직"""
    
    def __init__(self):
        self.tour_api = TourAPI()
        self.kakao_api = KakaoAPI()
        self.api_provider = settings.PLACE_API_PROVIDER.lower()  # tour 또는 kakao

    def _get_featured_places(self, section_type: str, limit: int, logger) -> Optional[List[Dict[str, Any]]]:
        """
        메인 HOT 섹션용 Featured 장소 목록을 DB에서 조회.
        - FEATURED_PLACE_IDS에 정의된 place_id들만 사용
        - google_photos 또는 imageUrl이 있는 장소만 사용
        - 평점/리뷰 하한 적용 후 googleRating / googleRatingsTotal 기준으로 정렬
        """
        if not settings.USE_FEATURED_PLACES:
            return None

        ids = FEATURED_PLACE_IDS.get(section_type) or []
        if not ids:
            return None

        db = get_database()
        places_col = db.places

        docs = list(places_col.find({"place_id": {"$in": ids}}))
        if not docs:
            logger.warning(f"No featured places found in DB for section_type={section_type}")
            return None

        featured: List[Dict[str, Any]] = []
        for doc in docs:
            if not isinstance(doc, dict):
                continue
            doc.pop("_id", None)
            item = dict(doc)

            # 이미지 우선순위: Google 사진 > 기존 image > 기존 imageUrl
            google_thumb = None
            google_photos = item.get("google_photos") or []
            if isinstance(google_photos, list) and google_photos:
                first = google_photos[0]
                if isinstance(first, dict):
                    google_thumb = first.get("url") or google_thumb
            base_image = item.get("image")
            existing_image_url = item.get("imageUrl")
            image_url = google_thumb or base_image or existing_image_url
            if image_url:
                item["imageUrl"] = image_url
            else:
                # 이미지가 전혀 없으면 메인 HOT 섹션에서는 사용하지 않음
                continue

            if "google_rating" in item and "googleRating" not in item:
                item["googleRating"] = item.get("google_rating")
            if "google_ratings_total" in item and "googleRatingsTotal" not in item:
                item["googleRatingsTotal"] = item.get("google_ratings_total")

            # 품질 필터: 평점 3 이상, 리뷰 10개 이상
            rating_raw = item.get("googleRating")
            total_raw = item.get("googleRatingsTotal")
            try:
                rating_val = float(rating_raw) if rating_raw is not None else 0.0
            except (TypeError, ValueError):
                rating_val = 0.0
            try:
                total_val = int(total_raw) if total_raw is not None else 0
            except (TypeError, ValueError):
                total_val = 0

            if rating_val < 3.0 or total_val < 10:
                # 최소 품질 기준 미달 시 Featured에서 제외
                continue

            featured.append(item)

        if not featured:
            return None

        def _score(p: Dict[str, Any]) -> tuple[float, int]:
            rating = p.get("googleRating") or 0.0
            total = p.get("googleRatingsTotal") or 0
            try:
                rating_f = float(rating)
            except (TypeError, ValueError):
                rating_f = 0.0
            try:
                total_i = int(total)
            except (TypeError, ValueError):
                total_i = 0
            return (rating_f, total_i)

        # 품질 기준으로 정렬한 뒤, 상위 후보들 중에서 섞어서 다양하게 노출
        featured.sort(key=_score, reverse=True)
        # 상위 2배 범위 안에서 랜덤 샘플링 (후보가 많을 때만)
        import random as _random
        top_n = featured[: max(limit * 2, limit)]
        if len(top_n) <= limit:
            return top_n
        return _random.sample(top_n, k=limit)
    
    async def refresh_section(self, section_type: str, limit: int = 6) -> Dict[str, Any]:
        """섹션 데이터 새로고침 (설정에 따라 TourAPI 또는 KakaoAPI 사용)"""
        import asyncio
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            # 1) Featured Places가 정의되어 있으면 우선 사용
            featured = self._get_featured_places(section_type, limit, logger)
            if featured:
                return {
                    "section_type": section_type,
                    "places": featured,
                    "count": len(featured),
                    "featured": True,
                }

            # 2) Featured가 없으면 기존 랜덤 로직 사용
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
                place_dict = place.to_dict()

                # 공통 표시 필드 추가 (이미지 우선순위: Google > Tour)
                google_thumb = None
                google_photos = place_dict.get("google_photos") or []
                if isinstance(google_photos, list) and google_photos:
                    first = google_photos[0]
                    if isinstance(first, dict):
                        google_thumb = first.get("url") or google_thumb
                base_image = place_dict.get("image")
                image_url = google_thumb or base_image
                if image_url:
                    place_dict["imageUrl"] = image_url
                if "google_rating" in place_dict:
                    place_dict["googleRating"] = place_dict.get("google_rating")
                if "google_ratings_total" in place_dict:
                    place_dict["googleRatingsTotal"] = place_dict.get("google_ratings_total")

                places.append(place_dict)
            except Exception as e:
                logger.warning(f"Failed to normalize place: {e}, item: {item}")
                continue

        # 이미지가 있는 장소 우선 필터링 (없으면 원본 유지)
        places_with_image = [p for p in places if p.get("imageUrl")]
        if places_with_image:
            places = places_with_image

        # 평점/리뷰 수 기준 정렬 (내림차순) - 값이 없으면 0으로 간주
        def _score(p: Dict[str, Any]) -> tuple[float, int]:
            rating = p.get("googleRating") or 0.0
            total = p.get("googleRatingsTotal") or 0
            try:
                rating_f = float(rating)
            except (TypeError, ValueError):
                rating_f = 0.0
            try:
                total_i = int(total)
            except (TypeError, ValueError):
                total_i = 0
            return (rating_f, total_i)

        places.sort(key=_score, reverse=True)
        logger.info(f"Extracted {len(places)} places (normalized, filtered for image)")
        
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
                place_dict = place.to_dict()

                # 공통 표시 필드 추가 (이미지 우선순위: Google > Kakao)
                google_thumb = None
                google_photos = place_dict.get("google_photos") or []
                if isinstance(google_photos, list) and google_photos:
                    first = google_photos[0]
                    if isinstance(first, dict):
                        google_thumb = first.get("url") or google_thumb
                base_image = place_dict.get("image")
                image_url = google_thumb or base_image
                if image_url:
                    place_dict["imageUrl"] = image_url
                if "google_rating" in place_dict:
                    place_dict["googleRating"] = place_dict.get("google_rating")
                if "google_ratings_total" in place_dict:
                    place_dict["googleRatingsTotal"] = place_dict.get("google_ratings_total")

                places.append(place_dict)
            except Exception as e:
                logger.warning(f"Failed to normalize place: {e}, item: {item}")
                continue

        # 이미지가 있는 장소 우선 필터링 (없으면 원본 유지)
        places_with_image = [p for p in places if p.get("imageUrl")]
        if places_with_image:
            places = places_with_image

        # 평점/리뷰 수 기준 정렬 (내림차순) - 값이 없으면 0으로 간주
        def _score_kakao(p: Dict[str, Any]) -> tuple[float, int]:
            rating = p.get("googleRating") or 0.0
            total = p.get("googleRatingsTotal") or 0
            try:
                rating_f = float(rating)
            except (TypeError, ValueError):
                rating_f = 0.0
            try:
                total_i = int(total)
            except (TypeError, ValueError):
                total_i = 0
            return (rating_f, total_i)

        places.sort(key=_score_kakao, reverse=True)
        logger.info(f"Extracted {len(places)} places (normalized, filtered for image)")
        
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

        place_dict: Optional[Dict[str, Any]] = None

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
                    place_dict = place.to_dict()
        except Exception as e:
            logger.warning(f"Logistics search (TourAPI) failed for {search_keyword}: {e}")

        # 2) Fallback: Kakao 로컬 API
        if place_dict is None:
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
                    place_dict = place.to_dict()
                    logger.info(f"Logistics: Kakao fallback used for {search_keyword}")
            except Exception as e:
                logger.warning(f"Logistics search (Kakao fallback) failed for {keyword}: {e}")

        if not place_dict:
            return None

        # 3) Google Places 정보로 평점/리뷰 등 보강 (필터링은 아직 수행하지 않음)
        try:
            lat = place_dict.get("latitude")
            lng = place_dict.get("longitude")
            # latitude/longitude가 문자열일 수 있으니 안전하게 변환 시도
            lat_f = float(lat) if lat is not None else None
            lng_f = float(lng) if lng is not None else None
        except (TypeError, ValueError):
            lat_f = None
            lng_f = None

        try:
            # 구글 검색은 정제된 이름 + 좌표로 호출해 매칭률 향상
            normalized_for_google = normalize_place_name_for_google(search_keyword)
            google_info = await asyncio.to_thread(
                google_places_service.search_place,
                normalized_for_google or search_keyword,
                lat_f,
                lng_f,
                region,
            )
            if google_info:
                place_dict["google_place_id"] = google_info.get("place_id")
                place_dict["google_rating"] = google_info.get("rating")
                place_dict["google_ratings_total"] = google_info.get("user_ratings_total")
                if google_info.get("google_photos"):
                    place_dict["google_photos"] = google_info["google_photos"]
        except Exception as e:
            logger.warning(f"Google Places enrichment failed for {search_keyword}: {e}")

        # 프리패치: 검색/계획 생성 시점에 구글 기본 정보를 DB에 저장해 두면
        # 메인/검색 리스트·상세 페이지에서 바로 활용 가능
        try:
            db = get_database()
            pid = place_dict.get("place_id")
            if pid:
                db.places.update_one(
                    {"place_id": pid},
                    {
                        "$set": {**place_dict, "updated_at": datetime.utcnow()},
                        "$setOnInsert": {"created_at": datetime.utcnow()},
                    },
                    upsert=True,
                )
        except Exception as e:
            logger.warning(f"Place prefetch upsert failed for {place_dict.get('place_id')}: {e}")

        return place_dict

