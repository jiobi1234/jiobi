from app.models.ai_plan_models import OptimizedPlanResponse, ScheduleItem
from app.services.tour_service import TourService
from app.api.kakao_api import KakaoAPI
from geopy.distance import geodesic
import logging
import asyncio
from app.core.mongodb import get_database
from app.models.place_models import PlaceNormalizer

logger = logging.getLogger(__name__)

class LogisticsService:
    def __init__(self):
        self.tour_service = TourService()
        self.kakao_api = KakaoAPI()
        self.db = get_database()
        self.place_normalizer = PlaceNormalizer()
        
    async def calculate_logistics(self, plan: OptimizedPlanResponse) -> OptimizedPlanResponse:
        """
        Module 3: Enriches the plan with coordinates, stay duration, travel time,
        and optionally adds nightly accommodations (숙소).
        """
        # 1. 좌표 및 체류 시간 채우기
        for day_plan in plan.days:
            schedule = day_plan.schedule
            
            for item in schedule:
                try:
                    keyword = item.place
                    
                    search_result = await self.tour_service.search_keyword_for_logistics(keyword)
                    
                    if search_result:
                        # Place.to_dict() uses standard names (longitude, latitude)
                        # Map these back to ScheduleItem's mapx/mapy (which expects strings)
                        item.mapx = str(search_result.get('longitude', ''))
                        item.mapy = str(search_result.get('latitude', ''))
                        # place_id 저장 (수동 계획과 동일한 형식으로 저장하기 위해)
                        item.place_id = search_result.get('place_id') or search_result.get('id')
                        print(f"DEBUG: Found coords for {keyword}: {item.mapx}, {item.mapy}, place_id: {item.place_id}")

                        # Place 정보를 MongoDB places 컬렉션에 upsert
                        try:
                            places_col = self.db.places
                            place_id_value = item.place_id
                            if place_id_value:
                                # search_result는 이미 PlaceNormalizer에서 온 표준 딕셔너리라고 가정
                                place_doc = dict(search_result)
                                place_doc["place_id"] = place_id_value
                                places_col.update_one(
                                    {"place_id": place_id_value},
                                    {"$set": place_doc},
                                    upsert=True,
                                )
                        except Exception as e:
                            logger.warning(f"Failed to upsert place for logistics item ({keyword}): {e}")
                    else:
                        print(f"DEBUG: No coords found for {keyword}")
                        
                except Exception as e:
                    logger.warning(f"Error searching coords for {item.place}: {e}")
                    print(f"DEBUG: Error searching {item.place}: {e}")
                
                # Assign detailed stay duration
                item.stay_duration = self._get_stay_duration(item.type)
                print(f"DEBUG: Assigned stay duration {item.stay_duration} to {item.place} ({item.type})")

        # 2. Day 간 숙소(숙박) 자동 추가
        await self._add_accommodations(plan)

        # 3. 이동 거리/시간 계산
        for day_plan in plan.days:
            schedule = day_plan.schedule
            for i in range(len(schedule) - 1):
                current = schedule[i]
                next_item = schedule[i+1]
                
                if current.mapx and current.mapy and next_item.mapx and next_item.mapy:
                    try:
                        coord1 = (float(current.mapy), float(current.mapx)) # lat, lon
                        coord2 = (float(next_item.mapy), float(next_item.mapx))
                        
                        dist_km = geodesic(coord1, coord2).km

                        # Estimate time
                        # 차량: 평균 30km/h (도심) + 5분 버퍼
                        minutes_car = int((dist_km / 30) * 60 + 5)
                        # 도보: 평균 4km/h
                        minutes_walk = int((dist_km / 4) * 60)

                        # Format output
                        current.distance_next = f"{dist_km:.1f}km"
                        current.travel_time_next = f"약 {minutes_car}분 (차량)"
                        current.travel_time_next_car = f"약 {minutes_car}분"
                        current.travel_time_next_walk = f"약 {minutes_walk}분"
                    except Exception as e:
                        logger.warning(f"Distance calc failed: {e}")
                        
        return plan

    def _get_stay_duration(self, place_type: str) -> str:
        """Returns average stay duration based on place type."""
        mapping = {
            "음식점": "1시간 30분",
            "카페": "1시간",
            "관광지": "1시간 30분", 
            "숙소": "숙박"
        }
        # Fuzzy match
        for key, value in mapping.items():
            if key in place_type:
                return value
        return "1시간"

    async def _add_accommodations(self, plan: OptimizedPlanResponse) -> None:
        """
        각 날짜의 마지막 장소와 다음 날 첫 장소 사이에 위치한 숙소를 자동으로 추천하여
        Day별 일정 마지막에 '숙소' 타입 ScheduleItem을 추가한다.
        """
        # Kakao API 키가 없으면 숙소 추천 스킵
        if not getattr(self.kakao_api, "api_key", None):
            logger.info("Kakao API key not configured. Skipping accommodation suggestions.")
            return

        for day_index, day_plan in enumerate(plan.days):
            # 여행 마지막 날에는 숙소를 추가하지 않는다
            if day_index == len(plan.days) - 1:
                continue
            schedule = day_plan.schedule
            # AI가 넣은 일반형 숙소(예: 인천 시내 숙소) 제거 후, 카카오 검색 숙소만 1개 추가
            schedule[:] = [i for i in schedule if "숙소" not in (i.type or "")]
            if not schedule:
                continue

            # 마지막 유효 좌표가 있는 일정(숙소 기준 좌표)
            last_item = None
            for item in reversed(schedule):
                if item.mapx and item.mapy:
                    last_item = item
                    break
            if not last_item:
                # 하루 전체에 좌표가 없으면 숙소 추천 불가
                logger.info(f"No valid coordinates in schedule for day {day_plan.day}, skipping accommodation.")
                continue

            # 마지막 날이 아니면 다음 날의 첫 장소 중 좌표가 있는 항목을 찾는다
            next_day = plan.days[day_index + 1] if day_index + 1 < len(plan.days) else None
            first_next = None
            if next_day and next_day.schedule:
                for item in next_day.schedule:
                    if item.mapx and item.mapy:
                        first_next = item
                        break

            try:
                # 좌표 확보: 마지막 장소 또는 중간 지점
                lat1 = float(last_item.mapy)
                lng1 = float(last_item.mapx)

                if first_next and first_next.mapx and first_next.mapy:
                    lat2 = float(first_next.mapy)
                    lng2 = float(first_next.mapx)
                    mid_lat = (lat1 + lat2) / 2.0
                    mid_lng = (lng1 + lng2) / 2.0
                else:
                    # 다음 날 정보가 없으면 마지막 장소 주변에서만 검색
                    mid_lat = lat1
                    mid_lng = lng1

                # 숙소 검색 (동기 API를 쓰므로 스레드로 감싸서 호출)
                result = await asyncio.to_thread(
                    self.kakao_api.search_accommodation_near,
                    mid_lat,
                    mid_lng,
                    5000,
                    1,
                    5,
                )
                documents = (result or {}).get("documents") or []

                # 모텔 제외 필터링
                filtered_docs = []
                for doc in documents:
                    name = (doc.get("place_name") or "").lower()
                    category = (doc.get("category_name") or "").lower()
                    if "모텔" in name or "모텔" in category:
                        continue
                    filtered_docs.append(doc)

                if not filtered_docs:
                    logger.info(f"No non-motel accommodation found near ({mid_lat}, {mid_lng}) for day {day_plan.day}")
                    continue

                doc = filtered_docs[0]

                # Kakao 숙소를 Place로 변환하여 DB에 upsert
                try:
                    place = self.place_normalizer.from_kakao_api(doc)
                    place_doc = place.to_dict()
                    place_id_value = place_doc.get("place_id")
                    if place_id_value:
                        places_col = self.db.places
                        places_col.update_one(
                            {"place_id": place_id_value},
                            {"$set": place_doc},
                            upsert=True,
                        )
                except Exception as e:
                    logger.warning(f"Failed to normalize/upsert accommodation place: {e}")

                # 숙소 ScheduleItem 생성
                accommodation = ScheduleItem(
                    time="22:00",
                    place=doc.get("place_name", "숙소"),
                    type="숙소",
                    description=doc.get("address_name") or "하루 일정을 마친 뒤 휴식",
                    place_id=str(doc.get("id")) if doc.get("id") is not None else None,
                    mapx=str(doc.get("x", "")),
                    mapy=str(doc.get("y", "")),
                    stay_duration="숙박",
                    travel_time_next=None,
                    distance_next=None,
                )

                schedule.append(accommodation)
                logger.info(f"Added accommodation for day {day_plan.day}: {accommodation.place}")

            except Exception as e:
                logger.warning(f"Failed to add accommodation for day {day_plan.day}: {e}")
