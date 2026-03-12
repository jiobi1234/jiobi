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
from app.models.route_models import (
    RouteRequest,
    RouteResponse,
    RouteSummary,
    RouteVertex,
    RouteGuide,
    RouteSection,
    RouteFare,
)
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


@router.get("/places/viewport")
async def search_places_in_viewport(
    sw_lat: float = Query(..., description="남서쪽 위도"),
    sw_lng: float = Query(..., description="남서쪽 경도"),
    ne_lat: float = Query(..., description="북동쪽 위도"),
    ne_lng: float = Query(..., description="북동쪽 경도"),
    category: Optional[str] = Query(None, description="카테고리 (food/cafe/spot 등)"),
    limit: int = Query(50, description="최대 개수"),
    include_external: bool = Query(False, description="외부 API(Tour/Kakao)로 결과 보강 여부"),
):
    """
    지도 뷰포트(위경도 박스) 기준 장소 검색.
    - 기본적으로 MongoDB places 컬렉션에서만 조회 (DB 우선).
    - include_external=True 일 때, 결과가 부족하면 Tour/Kakao 기반 search_places 결과를 재사용하여 보강.
    """
    from app.services.place_service import PlaceService

    place_service = PlaceService()
    try:
        result = await place_service.search_places_in_viewport(
            sw_lat=sw_lat,
            sw_lng=sw_lng,
            ne_lat=ne_lat,
            ne_lng=ne_lng,
            category=category,
            limit=limit,
            include_external=include_external,
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
    - 출력:
      - 전체 거리/시간 요약
      - 전체 폴리라인 좌표 (full_path/path)
      - 1번→2번, 2번→3번 등 구간별 거리/시간/좌표/가이드
    """
    from app.api.kakao_api import KakaoAPI

    if not request.points or len(request.points) < 2:
        raise HTTPException(status_code=400, detail="최소 2개 이상의 장소가 필요합니다.")

    def _extract_route_info(
        directions: dict,
        origin_point,
        dest_point,
    ) -> tuple[list[RouteVertex], int, int, list[RouteGuide], Optional[int], Optional[RouteFare]]:
        routes = directions.get("routes") or []
        if not routes:
            raise HTTPException(status_code=502, detail="Kakao 길찾기 결과를 가져오지 못했습니다.")

        first_route = routes[0] or {}
        summary_info = first_route.get("summary") or {}
        distance = int(summary_info.get("distance", 0) or 0)
        duration = int(summary_info.get("duration", 0) or 0)

        # 요금 정보 (있을 때만 사용)
        fare_info = summary_info.get("fare") or {}
        fare: Optional[RouteFare] = None
        taxi = fare_info.get("taxi")
        toll = fare_info.get("toll")
        if taxi is not None or toll is not None:
            fare = RouteFare(
                taxi=int(taxi) if taxi is not None else None,
                toll=int(toll) if toll is not None else None,
            )

        path_vertices: list[RouteVertex] = []
        sections_raw = first_route.get("sections") or []
        guides: list[RouteGuide] = []
        traffic_level: Optional[int] = None

        for section in sections_raw:
            # 도로 좌표
            for road in section.get("roads") or []:
                vertexes = road.get("vertexes") or []
                for j in range(0, len(vertexes) - 1, 2):
                    x, y = float(vertexes[j]), float(vertexes[j + 1])
                    path_vertices.append(RouteVertex(latitude=y, longitude=x))

            # 가이드(길안내) 정보
            for g in section.get("guides") or []:
                guides.append(
                    RouteGuide(
                        name=g.get("name"),
                        description=g.get("description") or g.get("instructions"),
                        distance=int(g.get("distance", 0) or 0)
                        if g.get("distance") is not None
                        else None,
                    )
                )

            # 교통 정체 정도(있을 때만) - 가장 심한 수준을 사용
            level = section.get("traffic_state") or section.get("traffic_level")
            try:
                if level is not None:
                    level_int = int(level)
                    traffic_level = max(traffic_level or 0, level_int)
            except (TypeError, ValueError):
                pass

        # vertexes가 비어 있으면 단순 직선으로 대체
        if not path_vertices:
            path_vertices = [
                RouteVertex(latitude=origin_point.latitude, longitude=origin_point.longitude),
                RouteVertex(latitude=dest_point.latitude, longitude=dest_point.longitude),
            ]

        return path_vertices, distance, duration, guides, traffic_level, fare

    try:
        kakao = KakaoAPI()
        total_distance = 0
        total_duration = 0
        total_taxi_fare = 0
        total_toll_fare = 0
        any_fare = False

        all_path: list[RouteVertex] = []
        sections: list[RouteSection] = []

        points = request.points

        for idx in range(len(points) - 1):
            origin_point = points[idx]
            dest_point = points[idx + 1]

            origin = (origin_point.longitude, origin_point.latitude)
            destination = (dest_point.longitude, dest_point.latitude)

            directions = kakao.get_directions(origin=origin, destination=destination)
            (
                path_vertices,
                distance,
                duration,
                guides,
                traffic_level,
                fare,
            ) = _extract_route_info(directions, origin_point, dest_point)

            total_distance += distance
            total_duration += duration

            if fare:
                any_fare = True
                if fare.taxi is not None:
                    total_taxi_fare += fare.taxi
                if fare.toll is not None:
                    total_toll_fare += fare.toll

            if idx == 0:
                all_path.extend(path_vertices)
            else:
                # 경계점 중복 제거
                all_path.extend(path_vertices[1:])

            sections.append(
                RouteSection(
                    section_index=idx,
                    from_index=idx,
                    to_index=idx + 1,
                    distance_meters=distance,
                    duration_seconds=duration,
                    path=path_vertices,
                    guides=guides,
                    traffic_level=traffic_level,
                )
            )

        if not all_path:
            all_path = [
                RouteVertex(latitude=points[0].latitude, longitude=points[0].longitude),
                RouteVertex(latitude=points[-1].latitude, longitude=points[-1].longitude),
            ]

        summary_fare: Optional[RouteFare] = None
        if any_fare:
            summary_fare = RouteFare(
                taxi=total_taxi_fare or None,
                toll=total_toll_fare or None,
            )

        return RouteResponse(
            summary=RouteSummary(
                distance_meters=total_distance,
                duration_seconds=total_duration,
                fare=summary_fare,
            ),
            path=all_path,
            full_path=all_path,
            sections=sections or None,
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
                detail="경로를 찾을 수 없습니다. 장소가 너무 멀리 떨어져 있거나, Kakao 길찾기에서 지원하지 않는 조합입니다.",
            )
        raise HTTPException(status_code=500, detail=f"길찾기 요청 중 오류가 발생했습니다: {err_msg}")

