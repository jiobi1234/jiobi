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


class RouteSummary(BaseModel):
    """경로 요약 정보"""
    distance_meters: int = Field(..., description="총 거리 (m)")
    duration_seconds: int = Field(..., description="총 예상 소요 시간 (초)")


class RouteResponse(BaseModel):
    """프론트에 내려줄 길찾기 결과"""
    summary: RouteSummary
    path: List[RouteVertex] = Field(..., description="지도에 그릴 폴리라인 좌표 목록")

