from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PlanRequest(BaseModel):
    region: str = Field(..., description="여행 지역 (예: 강원도 강릉)")
    duration: str = Field(..., description="여행 기간 (예: 1박 2일)")
    themes: List[str] = Field(..., description="여행 테마 리스트 (예: ['힐링', '맛집'])")
    companions: str = Field(..., description="동반자 (예: 부모님, 연인, 친구)")

class PlaceCandidate(BaseModel):
    name: str = Field(..., description="장소명")
    type: str = Field(..., description="장소 타입 (관광지, 음식점, 카페, 숙소)")
    reason: str = Field(..., description="추천 이유")

class PlaceSelectionResponse(BaseModel):
    region: str
    candidates: List[PlaceCandidate]
    existingPlan: Optional[Dict[str, Any]] = Field(None, description="기존 계획 (수정 모드일 때 사용)")

class ScheduleItem(BaseModel):
    time: str = Field(..., description="시간 (예: 10:00)")
    place: str = Field(..., description="장소명")
    type: str = Field(..., description="장소 타입 (관광지, 음식점, 카페, 숙소)")
    description: str = Field(..., description="활동 설명")
    
    # Module 3 Enrichments
    place_id: Optional[str] = Field(None, description="장소 ID (저장 시 사용)")
    mapx: Optional[str] = Field(None, description="X좌표 (경도)")
    mapy: Optional[str] = Field(None, description="Y좌표 (위도)")
    stay_duration: Optional[str] = Field(None, description="머무르는 시간 (예: 1시간 30분)")
    travel_time_next: Optional[str] = Field(None, description="다음 장소까지 이동 시간 (기본: 차량)")
    distance_next: Optional[str] = Field(None, description="다음 장소까지 거리 (km)")
    travel_time_next_car: Optional[str] = Field(None, description="다음 장소까지 이동 시간 (차량)")
    travel_time_next_walk: Optional[str] = Field(None, description="다음 장소까지 이동 시간 (도보)")
    google_rating: Optional[float] = Field(None, description="Google Places 평점")
    google_ratings_total: Optional[int] = Field(None, description="Google Places 리뷰 수")

class DayPlan(BaseModel):
    day: int = Field(..., description="일차 (1, 2...)")
    schedule: List[ScheduleItem] = Field(..., description="하루 일정 리스트")


class RecommendedAccommodation(BaseModel):
    place_id: Optional[str] = Field(None, description="숙소 place_id (상세/저장에 사용)")
    name: str = Field(..., description="숙소 이름")
    address: Optional[str] = Field(None, description="숙소 주소")
    latitude: Optional[float] = Field(None, description="위도")
    longitude: Optional[float] = Field(None, description="경도")
    google_rating: Optional[float] = Field(None, description="Google 평점")
    google_ratings_total: Optional[int] = Field(None, description="Google 리뷰 수")
    image_url: Optional[str] = Field(None, description="대표 이미지 URL (Google > Tour/Kakao)")
    tag_type: Optional[str] = Field(
        default=None,
        description="추천 유형 (예: near_end, near_start, balanced)",
    )
    tag_label: Optional[str] = Field(
        default=None,
        description="사용자에게 보여줄 추천 설명 문구",
    )


class DayAccommodationOptions(BaseModel):
    day: int = Field(..., description="일차 (1, 2...)")
    items: List[RecommendedAccommodation] = Field(..., description="추천 숙소 리스트 (최대 3개)")
    default_place_id: Optional[str] = Field(
        default=None,
        description="초기 기본 선택 숙소 place_id (일정에 미리 반영된 숙소)",
    )

class OptimizedPlanResponse(BaseModel):
    title: str = Field(..., description="여행 제목")
    days: List[DayPlan] = Field(..., description="일자별 계획")
    # 품질 메타데이터 (예: 엄격/완화 모드 여부)
    quality_level: Optional[str] = Field(
        default=None,
        description="후보 필터링 품질 수준 (예: strict, relaxed)",
    )
    quality_message: Optional[str] = Field(
        default=None,
        description="품질 기준 완화 등 사용자 안내 메시지",
    )
    # Day별 추천 숙소 옵션
    recommended_accommodations: Optional[List[DayAccommodationOptions]] = Field(
        default=None,
        description="각 날짜별 추천 숙소 목록 및 기본 선택 정보",
    )
