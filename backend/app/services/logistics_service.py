from typing import Optional

from app.models.ai_plan_models import OptimizedPlanResponse, ScheduleItem
from app.services.tour_service import TourService
from app.api.kakao_api import KakaoAPI
from geopy.distance import geodesic
import logging
import asyncio
from app.core.mongodb import get_database
from app.models.place_models import PlaceNormalizer
import re

logger = logging.getLogger(__name__)

class LogisticsService:
    def __init__(self):
        self.tour_service = TourService()
        self.kakao_api = KakaoAPI()
        self.db = get_database()
        self.place_normalizer = PlaceNormalizer()
        
    async def calculate_logistics(self, plan: OptimizedPlanResponse, region: str = None) -> OptimizedPlanResponse:
        """
        Module 3: Enriches the plan with coordinates, stay duration, travel time,
        and optionally adds nightly accommodations (숙소).
        region: 사용자가 입력한 여행 지역 (예: 강릉, 제주) - 검색 시 해당 지역 기준으로 검색
        """
        # 1. 좌표 및 체류 시간 채우기
        for day_plan in plan.days:
            schedule = day_plan.schedule
            
            for item in schedule:
                try:
                    keyword = item.place
                    
                    search_result = await self.tour_service.search_keyword_for_logistics(keyword, region=region)
                    
                    if search_result:
                        # Place.to_dict() uses standard names (longitude, latitude)
                        # Map these back to ScheduleItem's mapx/mapy (which expects strings)
                        item.mapx = str(search_result.get('longitude', ''))
                        item.mapy = str(search_result.get('latitude', ''))
                        # place_id 저장 (수동 계획과 동일한 형식으로 저장하기 위해)
                        item.place_id = search_result.get('place_id') or search_result.get('id')
                        # Google Places 평점/리뷰 정보 전달 (있을 때만)
                        if 'google_rating' in search_result:
                            item.google_rating = search_result.get('google_rating')
                        if 'google_ratings_total' in search_result:
                            item.google_ratings_total = search_result.get('google_ratings_total')
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

        # 2. Day 간 숙소(숙박) 자동 추천 + 기본 숙소 추가
        await self._add_accommodations(plan, region=region)

        # 3. 이동 거리/시간 계산 (장소 간 거리 기반)
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

        # 4. Day별 타임라인 정렬 (머무는 시간 + 이동시간을 고려하여 다음 일정 시간이 말이 되도록 조정)
        for day_plan in plan.days:
            self._adjust_day_timeline_with_travel(day_plan)

        # 5. (가능한 경우) 영업시간을 참고해 경고 메시지 추가
        for day_plan in plan.days:
            for item in day_plan.schedule:
                self._annotate_with_opening_hours_warning(item)

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

    # --- Time & opening-hours helpers -------------------------------------------------

    def _parse_time_to_minutes(self, time_str: Optional[str]) -> Optional[int]:
        """
        "HH:MM" 형태의 문자열을 분 단위 정수로 변환.
        파싱 실패 시 None 반환.
        """
        if not time_str:
            return None
        try:
            parts = time_str.strip().split(":")
            if len(parts) != 2:
                return None
            hour = int(parts[0])
            minute = int(parts[1])
            return hour * 60 + minute
        except Exception:
            return None

    def _format_minutes_to_time(self, minutes: int) -> str:
        """
        분 단위를 "HH:MM" 형식 문자열로 변환.
        하루(24시간)를 넘어가도 단순히 24로 나눈 나머지를 사용.
        """
        minutes = max(0, minutes)
        hour = (minutes // 60) % 24
        minute = minutes % 60
        return f"{hour:02d}:{minute:02d}"

    def _parse_korean_duration_to_minutes(self, duration: Optional[str]) -> int:
        """
        "1시간 30분", "1시간", "30분" 같은 한글 체류시간 문자열을 분 단위로 변환.
        인식 실패 시 기본값 60분 사용.
        "숙박"은 8시간(480분)으로 가정.
        """
        if not duration:
            return 60
        s = duration.strip()
        if "숙박" in s:
            return 8 * 60

        hours = 0
        minutes = 0

        m_hour = re.search(r"(\d+)\s*시간", s)
        m_min = re.search(r"(\d+)\s*분", s)
        if m_hour:
            try:
                hours = int(m_hour.group(1))
            except ValueError:
                hours = 0
        if m_min:
            try:
                minutes = int(m_min.group(1))
            except ValueError:
                minutes = minutes

        total = hours * 60 + minutes
        if total <= 0:
            return 60
        return total

    def _parse_travel_time_to_minutes(self, text: Optional[str]) -> int:
        """
        "약 90분 (차량)" / "약 20분" 같은 문자열에서 숫자 분(minute)을 추출.
        실패 시 0분.
        """
        if not text:
            return 0
        m = re.search(r"(\d+)\s*분", text)
        if not m:
            return 0
        try:
            return int(m.group(1))
        except ValueError:
            return 0

    def _adjust_day_timeline_with_travel(self, day_plan) -> None:
        """
        하루 단위로, 각 일정의 시작 시간을
        - 사용자가 지정한 시간
        - 이전 일정의 종료시간(머무는 시간) + 이동시간
        중 '더 늦은 쪽'으로 맞추어, 논리적으로 맞는 타임라인을 만든다.
        """
        schedule: list[ScheduleItem] = day_plan.schedule
        if not schedule:
            return

        prev_end_minutes: Optional[int] = None

        for idx, item in enumerate(schedule):
            # 1) 사용자가 준 시간 파싱 (없으면 이전 end 기준으로만 맞춘다)
            specified_start = self._parse_time_to_minutes(item.time)

            if prev_end_minutes is None:
                # 첫 일정: 사용자가 지정한 시간이 있으면 그대로 사용, 없으면 09:00 기준
                if specified_start is None:
                    start_minutes = 9 * 60
                else:
                    start_minutes = specified_start
            else:
                # 이전 일정의 종료시각 + 이동시간
                prev_item = schedule[idx - 1]
                travel_minutes = self._parse_travel_time_to_minutes(
                    getattr(prev_item, "travel_time_next_car", None)
                    or getattr(prev_item, "travel_time_next", None)
                )
                min_start = prev_end_minutes + travel_minutes

                if specified_start is None:
                    start_minutes = min_start
                else:
                    # 지정 시간이 너무 이르면, 최소 도착 가능 시간으로 밀어준다
                    start_minutes = max(specified_start, min_start)

            # 아이템의 time을 보정된 값으로 업데이트
            item.time = self._format_minutes_to_time(start_minutes)

            # 이 일정의 종료 시각 = 시작 + 체류시간
            stay_minutes = self._parse_korean_duration_to_minutes(
                getattr(item, "stay_duration", None)
            )
            prev_end_minutes = start_minutes + stay_minutes

    def _annotate_with_opening_hours_warning(self, item: ScheduleItem) -> None:
        """
        MongoDB에 저장된 Google opening_hours 정보를 참고해,
        방문 시간이 폐점 이후일 가능성이 높으면 description에 경고 문구를 추가한다.

        실제 요일 매칭까지는 하지 않고, weekday_text의 첫 번째 라인 시간대를 대표값으로 사용.
        """
        place_id = getattr(item, "place_id", None)
        if not place_id:
            return

        try:
            place_doc = self.db.places.find_one({"place_id": place_id})
        except Exception:
            return

        if not place_doc:
            return

        opening = place_doc.get("google_opening_hours") or {}
        weekday_text = opening.get("weekday_text") or []
        if not weekday_text or not isinstance(weekday_text, list):
            return

        # 예: "월요일: 10:00 – 17:00" 형태에서 첫 번째 시간 구간만 추출
        text_line = weekday_text[0]
        m = re.search(r"(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})", text_line)
        if not m:
            return

        try:
            close_minutes = self._parse_time_to_minutes(m.group(2))
        except Exception:
            close_minutes = None

        if close_minutes is None:
            return

        start_minutes = self._parse_time_to_minutes(getattr(item, "time", None))
        if start_minutes is None:
            return

        stay_minutes = self._parse_korean_duration_to_minutes(
            getattr(item, "stay_duration", None)
        )
        end_minutes = start_minutes + stay_minutes

        # 종료 시간이 영업 종료 시간보다 늦으면 경고 문구 추가
        if end_minutes > close_minutes:
            warning = "[주의] 이 일정은 영업 종료 시간 이후까지 이어질 수 있습니다. 실제 영업시간을 다시 확인해 주세요."
            desc = getattr(item, "description", "") or ""
            if warning not in desc:
                if desc:
                    item.description = desc + "\n" + warning
                else:
                    item.description = warning

    async def _add_accommodations(self, plan: OptimizedPlanResponse, region: Optional[str] = None) -> None:
        """
        각 날짜의 마지막 장소와 다음 날 첫 장소 사이에 위치한 숙소를 자동으로 추천하여
        Day별 일정 마지막에 '숙소' 타입 ScheduleItem을 추가한다.
        """
        # Kakao API 키가 없으면 숙소 추천 스킵
        if not getattr(self.kakao_api, "api_key", None):
            logger.info("Kakao API key not configured. Skipping accommodation suggestions.")
            return

        # 추천 숙소 메타데이터를 누적
        day_accommodation_options: list[dict] = []

        for day_index, day_plan in enumerate(plan.days):
            # 여행 마지막 날에는 숙소를 추가하지 않는다
            if day_index == len(plan.days) - 1:
                continue
            schedule = day_plan.schedule
            # 기존 AI가 넣은 일반형 숙소(예: 인천 시내 숙소)는 제거하고,
            # 이 함수에서 추천한 숙소만 사용
            schedule[:] = [i for i in schedule if "숙소" not in (i.type or "")]
            if not schedule:
                continue

            # 마지막 유효 좌표가 있는 일정 (오늘의 Anchor: End_d)
            last_item = None
            for item in reversed(schedule):
                if item.mapx and item.mapy:
                    last_item = item
                    break
            if not last_item:
                # 하루 전체에 좌표가 없으면 숙소 추천 불가
                logger.info(f"No valid coordinates in schedule for day {day_plan.day}, skipping accommodation.")
                continue

            # 마지막 날이 아니면 다음 날의 첫 장소 중 좌표가 있는 항목을 찾는다 (내일의 Anchor: Start_{d+1})
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

                # Kakao 숙소들을 기반으로, 오늘/내일 Anchor와의 거리 정보를 계산
                candidates: list[dict] = []
                for doc in filtered_docs:
                    try:
                        lat_h = float(doc.get("y"))
                        lng_h = float(doc.get("x"))
                    except (TypeError, ValueError):
                        continue

                    coord_h = (lat_h, lng_h)
                    coord_end = (lat1, lng1)
                    dist_end = geodesic(coord_end, coord_h).km

                    dist_start = None
                    if first_next and first_next.mapx and first_next.mapy:
                        try:
                            lat_start = float(first_next.mapy)
                            lng_start = float(first_next.mapx)
                            coord_start = (lat_start, lng_start)
                            dist_start = geodesic(coord_h, coord_start).km
                        except (TypeError, ValueError):
                            dist_start = None

                    candidates.append(
                        {
                            "doc": doc,
                            "dist_end": dist_end,
                            "dist_start": dist_start,
                        }
                    )

                if not candidates:
                    continue

                # 정렬 기준 준비
                by_end = sorted(candidates, key=lambda c: c["dist_end"])
                by_start = [c for c in candidates if c["dist_start"] is not None]
                by_start.sort(key=lambda c: c["dist_start"])  # type: ignore[arg-type]

                by_balanced: list[dict] = []
                for c in candidates:
                    de = c["dist_end"]
                    ds = c["dist_start"]
                    if ds is None:
                        continue
                    c["dist_sum"] = de + ds
                    by_balanced.append(c)
                by_balanced.sort(key=lambda c: c.get("dist_sum", 1e9))

                picked: list[dict] = []
                used_ids: set[str] = set()

                def pick_from(seq: list[dict], tag_type: str, tag_label: str):
                    for c in seq:
                        place_id_raw = str(c["doc"].get("id")) if c["doc"].get("id") is not None else None
                        if place_id_raw and place_id_raw in used_ids:
                            continue
                        c["tag_type"] = tag_type
                        c["tag_label"] = tag_label
                        picked.append(c)
                        if place_id_raw:
                            used_ids.add(place_id_raw)
                        break

                # 1) 오늘 마지막 장소 근처
                pick_from(by_end, "near_end", "오늘 마지막 장소 근처 숙소")

                # 2) 내일 첫 장소 근처
                if by_start:
                    pick_from(by_start, "near_start", "내일 첫 장소 근처 숙소")

                # 3) 오늘·내일 동선 모두 무난한 위치
                if by_balanced:
                    pick_from(by_balanced, "balanced", "오늘·내일 동선 모두 무난한 위치")

                if not picked:
                    continue

                # Kakao 숙소를 Place로 변환하여 DB에 upsert + Google 정보 보강 시도
                places_col = self.db.places
                reco_items: list[dict] = []
                default_place_id: Optional[str] = None

                for idx, cand in enumerate(picked):
                    doc = cand["doc"]
                    try:
                        place = self.place_normalizer.from_kakao_api(doc)
                        place_doc = place.to_dict()
                        place_id_value = place_doc.get("place_id")

                        # Google Places를 통한 추가 품질 정보 (이름 기반 검색)
                        try:
                            search_name = place_doc.get("title") or place_doc.get("place_name")
                            google_hit = None
                            if search_name:
                                google_hit = await self.tour_service.search_keyword_for_logistics(
                                    search_name, region=region
                                )
                            if google_hit:
                                place_doc.update(google_hit)
                        except Exception as e:
                            logger.warning(f"Failed to enrich accommodation with Google data: {e}")

                        if place_id_value:
                            places_col.update_one(
                                {"place_id": place_id_value},
                                {"$set": place_doc},
                                upsert=True,
                            )
                    except Exception as e:
                        logger.warning(f"Failed to normalize/upsert accommodation place: {e}")
                        place_id_value = None

                    # 추천 숙소 메타데이터 구성
                    name = doc.get("place_name", "숙소")
                    address = doc.get("address_name") or doc.get("road_address_name")
                    try:
                        lat_h = float(doc.get("y"))
                        lng_h = float(doc.get("x"))
                    except (TypeError, ValueError):
                        lat_h = None
                        lng_h = None

                    # DB에 저장된 google 필드가 있다면 우선 사용 (위 upsert 이후)
                    google_rating = None
                    google_ratings_total = None
                    image_url = None
                    if place_id_value:
                        db_doc = places_col.find_one({"place_id": place_id_value}) or {}
                        google_rating = db_doc.get("google_rating")
                        google_ratings_total = db_doc.get("google_ratings_total")
                        photos = db_doc.get("google_photos") or []
                        if photos and isinstance(photos, list):
                            first_photo = photos[0]
                            if isinstance(first_photo, dict):
                                image_url = first_photo.get("url")
                        if not image_url:
                            image_url = db_doc.get("image")

                    tag_type = cand.get("tag_type")
                    tag_label = cand.get("tag_label")

                    reco_items.append(
                        {
                            "place_id": place_id_value,
                            "name": name,
                            "address": address,
                            "latitude": lat_h,
                            "longitude": lng_h,
                            "google_rating": google_rating,
                            "google_ratings_total": google_ratings_total,
                            "image_url": image_url,
                            "tag_type": tag_type,
                            "tag_label": tag_label,
                        }
                    )

                    # 기본 숙소로 사용할 첫 번째 추천을 기록
                    if idx == 0 and place_id_value:
                        default_place_id = place_id_value

                if not reco_items:
                    continue

                # Day별 추천 숙소 목록에 추가
                day_accommodation_options.append(
                    {
                        "day": day_plan.day,
                        "items": reco_items,
                        "default_place_id": default_place_id,
                    }
                )

                # 기본 숙소를 일정 마지막에 ScheduleItem으로 삽입 (사용자가 별도 선택 안 했을 때용)
                default_doc = picked[0]["doc"]
                accommodation = ScheduleItem(
                    time="22:00",
                    place=default_doc.get("place_name", "숙소"),
                    type="숙소",
                    description=default_doc.get("address_name") or "하루 일정을 마친 뒤 휴식",
                    place_id=default_place_id or (str(default_doc.get("id")) if default_doc.get("id") is not None else None),
                    mapx=str(default_doc.get("x", "")),
                    mapy=str(default_doc.get("y", "")),
                    stay_duration="숙박",
                    travel_time_next=None,
                    distance_next=None,
                )

                schedule.append(accommodation)
                logger.info(f"Added accommodation for day {day_plan.day}: {accommodation.place}")

            except Exception as e:
                logger.warning(f"Failed to add accommodation for day {day_plan.day}: {e}")

        # 추천 숙소 메타데이터를 최종 Plan에 반영
        if day_accommodation_options:
            plan.recommended_accommodations = day_accommodation_options
