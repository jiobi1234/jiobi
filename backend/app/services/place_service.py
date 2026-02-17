import asyncio
from typing import Dict, Any, Optional, List
from app.api.tour_api import TourAPI
from app.api.kakao_api import KakaoAPI
from app.models.place_models import Place, PlaceNormalizer
from app.core.mongodb import get_database
from app.core.config import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class PlaceService:
    """장소 관련 서비스"""
    
    def __init__(self):
        self.tour_api = TourAPI()
        self.kakao_api = KakaoAPI()
        self.normalizer = PlaceNormalizer()
        self.api_provider = settings.PLACE_API_PROVIDER.lower()  # tour 또는 kakao
        self.db = get_database()
    
    async def _search_tour_api(
        self, 
        keyword: str, 
        page: int, 
        limit: int,
        region: Optional[str] = None,
        district: Optional[str] = None
    ) -> List[Place]:
        """TourAPI 검색 (내부 메서드, 비동기)"""
        try:
            # 동기 함수를 비동기로 실행
            tour_result = await asyncio.to_thread(
                self.tour_api.search_places, keyword, page, limit, region, district
            )
            tour_items = tour_result.get("response", {}).get("body", {}).get("items", {}).get("item", [])
            if not isinstance(tour_items, list):
                tour_items = [tour_items] if tour_items else []
            return self.normalizer.normalize_list(tour_items, source="tour")
        except Exception as e:
            logger.warning(f"TourAPI 검색 실패: {str(e)}")
            return []
    
    async def _search_kakao_api(
        self, 
        keyword: str, 
        page: int, 
        limit: int,
        region: Optional[str] = None,
        district: Optional[str] = None
    ) -> List[Place]:
        """KakaoAPI 검색 (내부 메서드, 비동기)"""
        try:
            # 동기 함수를 비동기로 실행
            kakao_result = await asyncio.to_thread(
                self.kakao_api.search_places, keyword, page, limit, region, district
            )
            kakao_items = kakao_result.get("documents", [])
            return self.normalizer.normalize_list(kakao_items, source="kakao")
        except Exception as e:
            logger.warning(f"KakaoAPI 검색 실패: {str(e)}")
            return []
    
    def _filter_by_region(self, places: List[Place], region: Optional[str], district: Optional[str]) -> List[Place]:
        """지역 필터링"""
        if not region and not district:
            return places
        
        filtered = []
        for place in places:
            if region and place.region != region:
                continue
            if district and place.district != district:
                continue
            filtered.append(place)
        return filtered
    
    def _merge_place_data(self, tour_places: List[Place], kakao_places: List[Place]) -> List[Place]:
        """두 API 결과를 통합하여 데이터 보강 (TourAPI 설명 + KakaoAPI 위치 정보)"""
        # KakaoAPI 결과를 딕셔너리로 변환 (이름+주소 기준)
        kakao_map = {}
        for place in kakao_places:
            key = f"{(place.title or place.place_name or '').strip()}|{(place.address or place.address_name or '').strip()}"
            if key:
                kakao_map[key] = place
        
        merged_places = []
        
        # TourAPI 결과를 기준으로 KakaoAPI 데이터 보강
        for tour_place in tour_places:
            title = (tour_place.title or tour_place.place_name or "").strip()
            address = (tour_place.address or tour_place.address_name or "").strip()
            key = f"{title}|{address}" if title and address else title
            
            # 같은 장소가 KakaoAPI에도 있으면 데이터 보강
            if key and key in kakao_map:
                kakao_place = kakao_map[key]
                # KakaoAPI의 정확한 좌표와 전화번호 정보로 보강
                if not tour_place.latitude and kakao_place.latitude:
                    tour_place.latitude = kakao_place.latitude
                if not tour_place.longitude and kakao_place.longitude:
                    tour_place.longitude = kakao_place.longitude
                # KakaoAPI의 카테고리 정보 보강
                if not tour_place.category and kakao_place.category:
                    tour_place.category = kakao_place.category
            
            merged_places.append(tour_place)
        
        # KakaoAPI에만 있는 장소 추가
        for kakao_place in kakao_places:
            title = (kakao_place.title or kakao_place.place_name or "").strip()
            address = (kakao_place.address or kakao_place.address_name or "").strip()
            key = f"{title}|{address}" if title and address else title
            
            # TourAPI에 없는 장소만 추가
            found = False
            for tour_place in tour_places:
                tour_title = (tour_place.title or tour_place.place_name or "").strip()
                tour_address = (tour_place.address or tour_place.address_name or "").strip()
                tour_key = f"{tour_title}|{tour_address}" if tour_title and tour_address else tour_title
                if key and key == tour_key:
                    found = True
                    break
            
            if not found:
                merged_places.append(kakao_place)
        
        return merged_places
    
    def _remove_duplicates(self, places: List[Place]) -> List[Place]:
        """중복 제거 (place_id, 이름+주소 기준)"""
        seen_ids = set()
        seen_names = set()
        unique_places = []
        
        for place in places:
            # 1차: place_id로 중복 체크
            place_id = place.place_id or place.id
            if place_id and place_id in seen_ids:
                continue
            
            # 2차: 이름+주소로 중복 체크 (place_id가 없는 경우)
            name_key = None
            if place.title or place.place_name:
                title = (place.title or place.place_name or "").strip()
                address = (place.address or place.address_name or "").strip()
                if title and address:
                    name_key = f"{title}|{address}"
                elif title:
                    name_key = title
            
            if name_key and name_key in seen_names:
                continue
            
            # 중복이 아니면 추가
            if place_id:
                seen_ids.add(place_id)
            if name_key:
                seen_names.add(name_key)
            unique_places.append(place)
        
        return unique_places
    
    async def search_places(
        self, 
        keyword: str = "", 
        page: int = 1, 
        limit: int = 10,
        region: Optional[str] = None,
        district: Optional[str] = None
    ) -> Dict[str, Any]:
        """장소 검색 (외부 API 병렬 호출)"""
        try:
            # 캐시 키 생성 (정규화: 빈 값 처리 및 소문자 변환)
            normalized_keyword = (keyword or "").strip().lower()
            normalized_region = (region or "").strip().lower()
            normalized_district = (district or "").strip().lower()
            cache_key = f"search:{normalized_keyword}:{normalized_region}:{normalized_district}:{page}:{limit}"
            
            # 캐시 확인
            db = get_database()
            cache_collection = db.search_cache
            cached_result = cache_collection.find_one({"cache_key": cache_key})
            
            if cached_result:
                logger.info(f"캐시에서 검색 결과 반환: {cache_key}")
                return {
                    "keyword": keyword,
                    "places": cached_result.get("places", []),
                    "page": page,
                    "limit": limit,
                    "total": cached_result.get("total", 0),
                    "cached": True
                }
            
            # 병렬로 외부 API 호출 (안전장치: 한쪽이 실패해도 다른 쪽 결과 반환)
            tour_task = self._search_tour_api(keyword, page, limit, region, district)
            kakao_task = self._search_kakao_api(keyword, page, limit, region, district)
            
            tour_places, kakao_places = await asyncio.gather(
                tour_task,
                kakao_task,
                return_exceptions=True
            )
            
            # 예외 처리 (한쪽 API가 실패해도 다른 쪽 결과는 사용)
            if isinstance(tour_places, Exception):
                logger.warning(f"TourAPI 오류 (다른 API 결과 사용): {str(tour_places)}")
                tour_places = []
            if isinstance(kakao_places, Exception):
                logger.warning(f"KakaoAPI 오류 (다른 API 결과 사용): {str(kakao_places)}")
                kakao_places = []
            
            # 두 API 모두 실패한 경우에만 에러
            if not tour_places and not kakao_places:
                raise Exception("모든 외부 API 호출이 실패했습니다.")
            
            # 결과 합치기 및 데이터 보강 (TourAPI 설명 + KakaoAPI 위치 정보)
            all_places = self._merge_place_data(list(tour_places), list(kakao_places))
            
            # 지역 필터링
            if region or district:
                all_places = self._filter_by_region(all_places, region, district)
            
            # 중복 제거
            unique_places = self._remove_duplicates(all_places)
            
            # 제한 적용
            limited_places = unique_places[:limit]
            
            # Place 객체를 딕셔너리로 변환
            places_dict = [place.to_dict() for place in limited_places]
            
            # 캐시 저장 (24시간 TTL) - 중복 방지
            try:
                cache_collection.insert_one({
                    "cache_key": cache_key,
                    "places": places_dict,
                    "total": len(unique_places),
                    "created_at": datetime.utcnow(),
                    "expires_at": datetime.utcnow() + timedelta(hours=24)
                })
            except Exception as e:
                # 중복 키 오류는 무시 (다른 요청이 이미 캐시를 저장한 경우)
                if "duplicate key" not in str(e).lower() and "E11000" not in str(e):
                    logger.warning(f"캐시 저장 실패: {str(e)}")
            
            return {
                "keyword": keyword,
                "places": places_dict,
                "page": page,
                "limit": limit,
                "total": len(unique_places),
                "cached": False
            }
        except Exception as e:
            logger.error(f"장소 검색 실패: {str(e)}")
            raise Exception(f"Failed to search places: {str(e)}")
    
    async def get_place_detail(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        장소 상세 정보 조회 우선순위:
        1) MongoDB places 컬렉션에서 place_id로 조회
        2) 외부 API(Tour/Kakao) 조회 후 Place로 normalize + DB에 upsert
        """
        try:
            logger.info(f"장소 상세 정보 조회 시작: place_id={place_id}, provider={self.api_provider}")

            places_col = self.db.places

            # 1) DB에서 먼저 조회
            doc = places_col.find_one({"place_id": place_id})
            if doc:
                logger.info(f"DB에서 장소 상세 정보 찾음: place_id={place_id}")
                # MongoDB ObjectId 제거
                doc.pop("_id", None)
                return doc

            # 2) 설정에 따라 외부 API 선택
            if self.api_provider == "kakao":
                place_data = await self._get_place_detail_kakao(place_id, logger)
            else:
                place_data = await self._get_place_detail_tour(place_id, logger)

            if not place_data:
                logger.warning(f"외부 API에서도 장소 상세 정보를 찾지 못함: place_id={place_id}")
                return None

            # 3) Place 데이터 DB에 upsert (향후 재사용 및 빠른 응답을 위해)
            try:
                place_id_value = place_data.get("place_id") or place_id
                place_data["place_id"] = place_id_value
                places_col.update_one(
                    {"place_id": place_id_value},
                    {"$set": place_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
                    upsert=True,
                )
            except Exception as e:
                logger.warning(f"Place upsert 실패 (place_id={place_id}): {e}")

            return place_data
        except Exception as e:
            logger.error(f"장소 상세 정보 조회 실패: {str(e)}")
            raise Exception(f"Failed to get place detail: {str(e)}")
    
    async def _get_place_detail_tour(self, place_id: str, logger) -> Optional[Dict[str, Any]]:
        """TourAPI를 사용한 장소 상세 정보 조회"""
        import asyncio
        
        # 방법 1: 검색 결과에서 찾기
        logger.info(f"[TourAPI] 검색 결과에서 장소 찾기 시도: {place_id}")
        
        try:
            tour_search_result = await asyncio.to_thread(
                self.tour_api.search_places, "", 1, 50  # 넓은 범위로 검색
            )
            
            # TourAPI 검색 결과에서 contentid 매칭
            if tour_search_result:
                items = tour_search_result.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if not isinstance(items, list):
                    items = [items] if items else []
                for item in items:
                    if str(item.get("contentid", "")) == place_id:
                        place = self.normalizer.from_tour_api(item)
                        logger.info(f"TourAPI 검색 결과에서 장소 찾음: {place_id}")
                        return place.to_dict()
        except Exception as e:
            logger.warning(f"TourAPI 검색 실패: {str(e)}")
        
        # 방법 2: 직접 상세 정보 조회 시도
        logger.info(f"[TourAPI] 검색 결과에서 못 찾음, 직접 조회 시도: {place_id}")
        is_tour_contentid = place_id.isdigit()
        
        if is_tour_contentid:
            try:
                tour_result = await asyncio.to_thread(
                    self.tour_api.get_place_detail, place_id
                )
                items = tour_result.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                if items:
                    item = items[0] if isinstance(items, list) else items
                    place = self.normalizer.from_tour_api(item)
                    logger.info(f"TourAPI 직접 조회 성공: {place_id}")
                    return place.to_dict()
            except Exception as e:
                logger.warning(f"TourAPI 직접 조회 실패: {str(e)}")
        
        logger.warning(f"TourAPI로 장소 상세 정보를 찾을 수 없음: {place_id}")
        return None
    
    async def _get_place_detail_kakao(self, place_id: str, logger) -> Optional[Dict[str, Any]]:
        """KakaoAPI를 사용한 장소 상세 정보 조회"""
        import asyncio
        
        # KakaoAPI는 place_id로 직접 조회하는 API가 없으므로
        # place_id를 키워드로 검색하여 찾아야 함
        logger.info(f"[KakaoAPI] place_id로 검색 시도: {place_id}")
        
        try:
            # 방법 1: place_id를 키워드로 검색 (KakaoAPI의 get_place_detail 사용)
            kakao_result = await asyncio.to_thread(
                self.kakao_api.get_place_detail, place_id
            )
            
            if kakao_result and kakao_result.get("id"):
                # place_id가 일치하는지 확인
                if str(kakao_result.get("id", "")) == place_id:
                    place = self.normalizer.from_kakao_api(kakao_result)
                    logger.info(f"KakaoAPI place_id 검색으로 장소 찾음: {place_id}")
                    return place.to_dict()
        except Exception as e:
            logger.warning(f"KakaoAPI place_id 검색 실패: {str(e)}")
        
        # 방법 2: 넓은 범위로 검색하여 place_id 매칭 시도
        logger.info(f"[KakaoAPI] 넓은 범위 검색으로 장소 찾기 시도: {place_id}")
        
        try:
            # 여러 키워드로 검색 시도 (서울 지역의 다양한 카테고리)
            search_keywords = ["서울", "음식점", "카페", "쇼핑", "숙박"]
            
            for keyword in search_keywords:
                try:
                    kakao_search_result = await asyncio.to_thread(
                        self.kakao_api.search_places, keyword, 1, 45  # 최대 45개까지 검색
                    )
                    
                    if kakao_search_result:
                        documents = kakao_search_result.get("documents", [])
                        for doc in documents:
                            if str(doc.get("id", "")) == place_id:
                                place = self.normalizer.from_kakao_api(doc)
                                logger.info(f"KakaoAPI 넓은 범위 검색으로 장소 찾음: {place_id} (키워드: {keyword})")
                                return place.to_dict()
                except Exception as e:
                    logger.warning(f"KakaoAPI 키워드 검색 실패 (키워드: {keyword}): {str(e)}")
                    continue
        except Exception as e:
            logger.warning(f"KakaoAPI 넓은 범위 검색 실패: {str(e)}")
        
        logger.warning(f"KakaoAPI로 장소 상세 정보를 찾을 수 없음: {place_id}")
        logger.warning(f"참고: KakaoAPI는 place_id로 직접 조회하는 API가 없어서 검색으로 찾아야 합니다.")
        return None

