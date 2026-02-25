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
        # 1.5단계: 검색 게이트 — 검색되는 후보만 optimize에 전달 (장소가 안 나오는 불만 차단)
        filtered_candidates: list[PlaceCandidate] = []
        for c in request.candidates:
            hit = await tour_service.search_keyword_for_logistics(c.name, region=request.region)
            if hit is not None:
                filtered_candidates.append(c)
            else:
                logger.info(f"Place candidate dropped (no search result): {c.name}")
        if not filtered_candidates:
            raise HTTPException(
                status_code=422,
                detail="추천된 장소 중 지도에서 검색되는 곳이 없습니다. 지역명이나 테마를 조금 바꿔서 다시 시도해 주세요."
            )
        if len(filtered_candidates) < len(request.candidates):
            logger.info(f"Filtered {len(request.candidates)} -> {len(filtered_candidates)} candidates (search gate)")

        candidates_list = [c.dict() for c in filtered_candidates]
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
            
            return final_plan
            
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON from AI: {json_text[:100]}...")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
