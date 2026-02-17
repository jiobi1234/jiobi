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

class DayPlan(BaseModel):
    day: int = Field(..., description="일차 (1, 2...)")
    schedule: List[ScheduleItem] = Field(..., description="하루 일정 리스트")

class OptimizedPlanResponse(BaseModel):
    title: str = Field(..., description="여행 제목")
    days: List[DayPlan] = Field(..., description="일자별 계획")
