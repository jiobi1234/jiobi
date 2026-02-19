from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.api.auth import get_current_user
from app.services.theme_service import ThemeService
from app.services.wishlist_service import WishlistService
from app.models.theme_models import (
    CreateThemeRequest,
    UpdateThemeRequest,
    ThemeResponse,
    ThemesResponse,
)
from app.models.plan_models import PlanCreateRequest
from app.models.route_models import RouteRequest, RouteResponse, RouteSummary, RouteVertex
from app.models.wishlist_models import (
    WishlistCreateRequest,
    WishlistListResponse,
    WishlistItem,
)

router = APIRouter()
security = HTTPBearer()
theme_service = ThemeService()
wishlist_service = WishlistService()

# 서비스 인스턴스는 함수 내부에서 생성 (순환 import 방지)

@router.get("/refresh-section/")
async def refresh_section(
    section_type: str = Query(..., description="섹션 타입"),
    limit: int = Query(6, description="제한 개수")
):
    """섹션 데이터 새로고침"""
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        result = await tour_service.refresh_section(section_type, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_places(
    keyword: Optional[str] = Query(None, description="검색 키워드"),
    page: int = Query(1, description="페이지 번호"),
    limit: int = Query(10, description="페이지당 개수"),
    region: Optional[str] = Query(None, description="시도 (예: 서울, 경기)"),
    district: Optional[str] = Query(None, description="구/군 (예: 강남구, 수원시)")
):
    """장소 검색"""
    from app.services.place_service import PlaceService
    place_service = PlaceService()
    try:
        # 키워드나 지역 중 하나는 필수
        if not keyword and not region and not district:
            raise HTTPException(status_code=400, detail="검색 키워드 또는 지역을 입력해주세요.")
        
        result = await place_service.search_places(
            keyword or "", 
            page, 
            limit, 
            region, 
            district
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/place/{place_id}")
async def get_place_detail(place_id: str):
    """장소 상세 정보"""
    from app.services.place_service import PlaceService
    place_service = PlaceService()
    try:
        result = await place_service.get_place_detail(place_id)
        if not result:
            raise HTTPException(status_code=404, detail="Place not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/theme/{theme_name}")
async def get_theme_places(
    theme_name: str,
    page: int = Query(1, description="페이지 번호"),
    limit: int = Query(10, description="페이지당 개수")
):
    """테마별 장소 조회"""
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        result = await tour_service.get_theme_places(theme_name, page, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan")
async def create_plan(
    plan_data: PlanCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    여행 계획 생성

    - 항상 현재 로그인한 사용자의 user_id를 토큰에서 추출하여 사용
    - 클라이언트에서 넘어온 user_id는 무시
    """
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user")

        data = plan_data.dict()
        data["user_id"] = user_id

        result = await tour_service.create_plan(data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wishlist", response_model=WishlistListResponse)
async def get_wishlist(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """현재 로그인한 사용자의 위시리스트 조회"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user")

        items = await wishlist_service.get_wishlist(user_id)
        # Pydantic 모델에 맞게 변환
        return WishlistListResponse(
            items=[WishlistItem(**item) for item in items]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wishlist", response_model=WishlistItem)
async def add_to_wishlist(
    wishlist_data: WishlistCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """현재 로그인한 사용자의 위시리스트에 장소 추가"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user")

        result = await wishlist_service.add_to_wishlist(
            user_id, wishlist_data.dict()
        )
        return WishlistItem(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/wishlist/{place_id}")
async def remove_from_wishlist(
    place_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """현재 로그인한 사용자의 위시리스트에서 장소 제거"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user")

        result = await wishlist_service.remove_from_wishlist(user_id, place_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plan/{plan_id}")
async def get_plan(plan_id: str):
    """여행 계획 조회"""
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        result = await tour_service.get_plan(plan_id)
        if not result:
            raise HTTPException(status_code=404, detail="Plan not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/plan/{plan_id}")
async def update_plan(plan_id: str, plan_data: PlanCreateRequest):
    """여행 계획 수정"""
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        result = await tour_service.update_plan(plan_id, plan_data.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/plan/{plan_id}")
async def delete_plan(plan_id: str):
    """여행 계획 삭제"""
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        result = await tour_service.delete_plan(plan_id)
        if not result.get("success"):
            raise HTTPException(status_code=404, detail="Plan not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans")
async def get_user_plans(
    page: int = Query(1, description="페이지 번호"),
    limit: int = Query(10, description="페이지당 개수"),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    현재 로그인한 사용자의 여행 계획 목록
    (토큰에서 user_id를 추출하여 사용)
    """
    from app.services.tour_service import TourService
    tour_service = TourService()
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user")

        result = await tour_service.get_user_plans(user_id, page, limit)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/themes", response_model=ThemeResponse)
async def create_theme(
    theme_data: CreateThemeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """테마 생성 (관리자만)"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        
        # 사용자 이메일 가져오기
        from app.services.auth_service import AuthService
        auth_service = AuthService()
        user = await auth_service.get_current_user(user_id)
        
        return await theme_service.create_theme(theme_data, user.email)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes", response_model=ThemesResponse)
async def get_themes():
    """테마 목록 조회"""
    try:
        return await theme_service.get_themes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/themes/{theme_id}", response_model=ThemeResponse)
async def get_theme(theme_id: str):
    """특정 테마 조회"""
    try:
        return await theme_service.get_theme(theme_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/themes/{theme_id}")
async def update_theme(
    theme_id: str,
    theme_data: UpdateThemeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """테마 수정 (관리자만)"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        
        # 사용자 이메일 가져오기
        from app.services.auth_service import AuthService
        auth_service = AuthService()
        user = await auth_service.get_current_user(user_id)
        
        return await theme_service.update_theme(theme_id, theme_data, user.email)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/themes/{theme_id}")
async def delete_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """테마 삭제 (관리자만)"""
    try:
        payload = get_current_user(credentials)
        user_id = payload.get("user_id")
        
        # 사용자 이메일 가져오기
        from app.services.auth_service import AuthService
        auth_service = AuthService()
        user = await auth_service.get_current_user(user_id)
        
        return await theme_service.delete_theme(theme_id, user.email)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/route", response_model=RouteResponse)
async def get_route_for_day(request: RouteRequest):
    """
    Day 단위 길찾기 경로 조회 (투어/카카오 장소 혼합 지원)
    - 입력: 순서가 정해진 장소 목록 (points)
    - 출력: 총 거리/시간 요약 + 지도 폴리라인 좌표
    """
    from app.api.kakao_api import KakaoAPI

    if not request.points or len(request.points) < 2:
        raise HTTPException(status_code=400, detail="최소 2개 이상의 장소가 필요합니다.")

    # Kakao 모빌리티: 경유지 최대 5개 (총 7개 장소). 8개 이상이면 7개씩 끊어서 여러 번 호출 후 이어붙임
    SEGMENT_SIZE = 7

    def _extract_path_and_summary(directions: dict, origin_point, dest_point) -> tuple[list[RouteVertex], int, int]:
        routes = directions.get("routes") or []
        if not routes:
            raise HTTPException(status_code=502, detail="Kakao 길찾기 결과를 가져오지 못했습니다.")
        first_route = routes[0]
        summary_info = first_route.get("summary") or {}
        distance = int(summary_info.get("distance", 0))
        duration = int(summary_info.get("duration", 0))
        path_vertices: list[RouteVertex] = []
        sections = first_route.get("sections") or []
        for section in sections:
            for road in section.get("roads") or []:
                vertexes = road.get("vertexes") or []
                for j in range(0, len(vertexes) - 1, 2):
                    x, y = float(vertexes[j]), float(vertexes[j + 1])
                    path_vertices.append(RouteVertex(latitude=y, longitude=x))
        if not path_vertices:
            path_vertices = [
                RouteVertex(latitude=origin_point.latitude, longitude=origin_point.longitude),
                RouteVertex(latitude=dest_point.latitude, longitude=dest_point.longitude),
            ]
        return path_vertices, distance, duration

    try:
        kakao = KakaoAPI()
        total_distance = 0
        total_duration = 0
        all_path: list[RouteVertex] = []
        i = 0

        while i < len(request.points):
            end = min(i + SEGMENT_SIZE, len(request.points))
            segment = request.points[i:end]
            if len(segment) < 2:
                break

            origin_point = segment[0]
            dest_point = segment[-1]
            waypoint_points = segment[1:-1]
            if len(waypoint_points) > 5:
                waypoint_points = waypoint_points[:5]

            origin = (origin_point.longitude, origin_point.latitude)
            destination = (dest_point.longitude, dest_point.latitude)
            waypoints = [(p.longitude, p.latitude) for p in waypoint_points] or None

            directions = kakao.get_directions(origin=origin, destination=destination, waypoints=waypoints)
            path_vertices, distance, duration = _extract_path_and_summary(directions, origin_point, dest_point)

            total_distance += distance
            total_duration += duration
            if i == 0:
                all_path.extend(path_vertices)
            else:
                all_path.extend(path_vertices[1:])  # 경계점 중복 제거

            i = end - 1

        if not all_path:
            all_path = [
                RouteVertex(latitude=request.points[0].latitude, longitude=request.points[0].longitude),
                RouteVertex(latitude=request.points[-1].latitude, longitude=request.points[-1].longitude),
            ]

        return RouteResponse(
            summary=RouteSummary(distance_meters=total_distance, duration_seconds=total_duration),
            path=all_path,
        )
    except HTTPException:
        raise
    except ValueError as e:
        # API 키 없거나 설정 문제 등
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        err_msg = str(e)
        # Kakao API 400 응답 시 사용자 친화적 메시지
        if "400" in err_msg or "Bad Request" in err_msg:
            raise HTTPException(
                status_code=400,
                detail="경로를 찾을 수 없습니다. 장소가 너무 멀리 떨어져 있거나, 해당 Day의 장소를 7개 이하로 줄여주세요.",
            )
        raise HTTPException(status_code=500, detail=f"길찾기 요청 중 오류가 발생했습니다: {err_msg}")

