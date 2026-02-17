"""
여행 계획(Plan) 관련 모델
"""

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel


class PlanItem(BaseModel):
    """여행 계획 내 개별 일정 아이템

    * place_id: 어떤 장소인지
    * date: 어느 날짜(예: 2024-01-15)에 방문하는지
    * start_time / end_time: 몇 시부터 몇 시까지
    * notes: 메모
    """

    place_id: str
    date: Optional[str] = None  # YYYY-MM-DD 형태 권장
    start_time: Optional[str] = None  # HH:MM 형태 권장
    end_time: Optional[str] = None  # HH:MM 형태 권장
    notes: Optional[str] = None


class PlanCreateRequest(BaseModel):
    """여행 계획 생성 요청 모델 (1단계: 기본 구조)

    - 이후 단계에서 items 필드에 구체적인 장소/시간 정보를 채워나감
    """

    title: str  # 계획 제목
    description: Optional[str] = None  # 계획 설명
    start_date: Optional[str] = None  # 여행 시작일 (YYYY-MM-DD)
    end_date: Optional[str] = None  # 여행 종료일 (YYYY-MM-DD)
    items: List[PlanItem] = []  # 일정 아이템 목록 (초기에는 빈 배열 허용)
    user_id: Optional[str] = None  # 추후 인증 연동 시 서버에서 채울 예정

