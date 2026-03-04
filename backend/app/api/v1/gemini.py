from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import GeminiService
from app.services.tour_service import TourService
from app.models.ai_plan_models import PlanRequest, PlaceSelectionResponse, OptimizedPlanResponse, PlaceCandidate
import json
import logging
from typing import Optional

router = APIRouter()
gemini_service = GeminiService()
tour_service = TourService()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    """
    Send a message to Gemini and get a response.
    """
    try:
        response_text = await gemini_service.generate_text(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/places/select", response_model=PlaceSelectionResponse)
async def select_places(request: PlanRequest):
    """
    Module 1: Select places based on user input.
    """
    try:
        json_text = await gemini_service.select_places(
            region=request.region,
            duration=request.duration,
            themes=request.themes,
            companions=request.companions
        )
        
        # Parse JSON string to Python dict
        try:
            data = json.loads(json_text)
            return PlaceSelectionResponse(**data)
        except json.JSONDecodeError:
            # Fallback handling or retry logic could be added here
            raise ValueError(f"Invalid JSON from AI: {json_text[:100]}...")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/places/optimize", response_model=OptimizedPlanResponse)
async def optimize_route(
    request: PlaceSelectionResponse, 
    duration: str = "1박 2일", 
    editRequest: Optional[str] = None
):
    """
    Module 2: Optimize route based on selected places.
    1.5단계: 검색 게이트 - 지도/길찾기 API에서 검색되지 않는 후보는 제외 후 optimize 진행.
    Supports editing existing plans when editRequest is provided.
    """
    try:
        # 1.5단계: 검색 + 품질 게이트 (2단계 필터)
        # - 1차: 엄격 기준 (평점 >= 3.0, 리뷰수 >= 30)
        # - 2차: 완화 기준 (평점 >= 2.8, 리뷰수 >= 10) - 1차가 모두 실패했을 때만 사용
        strict_candidates: list[PlaceCandidate] = []
        relaxed_candidates: list[PlaceCandidate] = []
        dropped_no_search = 0
        dropped_low_quality = 0

        for c in request.candidates:
            hit = await tour_service.search_keyword_for_logistics(c.name, region=request.region)
            if not hit:
                dropped_no_search += 1
                logger.info(f"Place candidate dropped (no search result): {c.name}")
                continue

            rating = hit.get("google_rating")
            reviews = hit.get("google_ratings_total")

            if rating is None or reviews is None:
                dropped_low_quality += 1
                logger.info(
                    f"Place candidate dropped (no google data): {c.name} "
                    f"(rating={rating}, reviews={reviews})"
                )
                continue

            # 안전한 숫자 변환
            try:
                rating_val = float(rating)
            except (TypeError, ValueError):
                rating_val = 0.0
            try:
                reviews_val = int(reviews)
            except (TypeError, ValueError):
                reviews_val = 0

            # 1차: 엄격 기준
            if rating_val >= 3.0 and reviews_val >= 30:
                strict_candidates.append(c)
                continue

            # 2차: 완화 기준
            if rating_val >= 2.8 and reviews_val >= 10:
                relaxed_candidates.append(c)
                continue

            dropped_low_quality += 1
            logger.info(
                f"Place candidate dropped (below relaxed quality): {c.name} "
                f"(rating={rating_val}, reviews={reviews_val})"
            )

        quality_level: str = "strict"
        quality_message: Optional[str] = None

        if strict_candidates:
            used_candidates = strict_candidates
        elif relaxed_candidates:
            used_candidates = relaxed_candidates
            quality_level = "relaxed"
            quality_message = (
                "엄격한 기준(평점 3.0점 이상, 리뷰 30개 이상)을 만족하는 장소가 없어, "
                "조금 더 넓은 기준(평점 2.8점 이상, 리뷰 10개 이상)으로 계획을 생성했습니다."
            )
        else:
            raise HTTPException(
                status_code=422,
                detail="해당 지역에서 Google Places 기준을 만족하는 장소를 찾기 어려웠습니다. "
                       "지역명이나 테마를 조금 바꿔서 다시 시도해 주세요."
            )

        if dropped_no_search or dropped_low_quality:
            logger.info(
                f"Filtered {len(request.candidates)} -> {len(used_candidates)} candidates "
                f"(no_search={dropped_no_search}, low_quality={dropped_low_quality}, "
                f"mode={quality_level})"
            )

        candidates_list = [c.dict() for c in used_candidates]
        existing_plan = getattr(request, 'existingPlan', None)

        json_text = await gemini_service.optimize_route(
            region=request.region,
            duration=duration,
            candidates=candidates_list,
            edit_request=editRequest,
            existing_plan=existing_plan
        )
        
        try:
            data = json.loads(json_text)
            plan = OptimizedPlanResponse(**data)
            
            # Enrich with logistics (Module 3) - region 전달하여 해당 지역 기준 검색
            from app.services.logistics_service import LogisticsService
            logistics_service = LogisticsService()
            final_plan = await logistics_service.calculate_logistics(plan, region=request.region)

            # 품질 메타데이터 추가 (완화 모드 등)
            final_plan.quality_level = quality_level
            final_plan.quality_message = quality_message

            return final_plan
            
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON from AI: {json_text[:100]}...")
            
    except HTTPException:
        # 위에서 명시적으로 발생시킨 HTTPException(예: 422)은 그대로 전달
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
