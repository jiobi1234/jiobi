from typing import List, Optional

from pydantic import BaseModel, Field


class RoutePoint(BaseModel):
    """길찾기용 경유지/장소 정보 (출처 무관, 좌표 기반)"""

    place_id: Optional[str] = Field(default=None, description="장소 식별자 (tour/kakao 공통)")
    name: Optional[str] = Field(default=None, description="장소 이름 (표시용)")
    latitude: float = Field(..., description="위도 (WGS84)")
    longitude: float = Field(..., description="경도 (WGS84)")


class RouteRequest(BaseModel):
    """Day 단위 길찾기 요청"""

    points: List[RoutePoint] = Field(..., description="경로를 구성하는 장소 목록 (순서대로)")


class RouteVertex(BaseModel):
    """지도에 그릴 경로 좌표 (폴리라인)"""

    latitude: float
    longitude: float


class RouteFare(BaseModel):
    """예상 요금 정보 (있을 때만 사용)"""

    taxi: Optional[int] = Field(default=None, description="예상 택시 요금 (원)")
    toll: Optional[int] = Field(default=None, description="예상 통행료 (원)")


class RouteSummary(BaseModel):
    """경로 요약 정보"""

    distance_meters: int = Field(..., description="총 거리 (m)")
    duration_seconds: int = Field(..., description="총 예상 소요 시간 (초)")
    fare: Optional[RouteFare] = Field(default=None, description="요금 정보 (선택)")


class RouteGuide(BaseModel):
    """구간별 내비게이션 안내 문구 (있을 때만 사용)"""

    name: Optional[str] = Field(default=None, description="명령 이름 (예: 좌회전, 우회전)")
    description: Optional[str] = Field(default=None, description="안내 문구")
    distance: Optional[int] = Field(default=None, description="해당 안내까지 남은 거리 (m)")


class RouteSection(BaseModel):
    """1번 → 2번, 2번 → 3번 같은 구간 단위 정보"""

    section_index: int = Field(..., description="0부터 시작하는 구간 인덱스")
    from_index: int = Field(..., description="시작 장소 인덱스 (points 기준)")
    to_index: int = Field(..., description="도착 장소 인덱스 (points 기준)")
    distance_meters: int = Field(..., description="구간 거리 (m)")
    duration_seconds: int = Field(..., description="구간 예상 소요 시간 (초)")
    path: List[RouteVertex] = Field(..., description="구간에 해당하는 폴리라인 좌표 목록")
    guides: List[RouteGuide] = Field(
        default_factory=list,
        description="구간 내 간단 안내 리스트 (예: 300m 앞 우회전)",
    )
    traffic_level: Optional[int] = Field(
        default=None,
        description="교통 정체 정도 (API 응답에 있을 경우, 0=원활~3=정체 정도로 사용)",
    )


class RouteResponse(BaseModel):
    """프론트에 내려줄 길찾기 결과"""

    summary: RouteSummary
    # 기존 필드: 전체 경로를 path에 그대로 유지 (하위 호환성)
    path: List[RouteVertex] = Field(..., description="지도에 그릴 전체 폴리라인 좌표 목록")
    # 확장 필드: 전체 경로를 명시적으로 full_path에도 노출 (프론트 선택 사용)
    full_path: Optional[List[RouteVertex]] = Field(
        default=None,
        description="전체 폴리라인 좌표 목록 (path와 동일, 선택 필드)",
    )
    # 확장 필드: 구간별 정보 (1→2, 2→3 ...)
    sections: Optional[List[RouteSection]] = Field(
        default=None,
        description="구간별 거리/시간/좌표/가이드 정보 (있을 때만 전달)",
    )

