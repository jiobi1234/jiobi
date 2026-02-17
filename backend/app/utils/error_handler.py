"""
에러 처리 유틸리티
백엔드에서 일관된 에러 응답을 제공하기 위한 유틸리티
"""

from fastapi import HTTPException, status
from typing import Optional, Dict, Any


class ApiError(Exception):
    """API 에러 기본 클래스"""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(self.message)


class NotFoundError(ApiError):
    """리소스를 찾을 수 없을 때"""
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource}을(를) 찾을 수 없습니다."
        if identifier:
            message = f"{resource} '{identifier}'을(를) 찾을 수 없습니다."
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"resource": resource, "identifier": identifier}
        )


class ValidationError(ApiError):
    """검증 에러"""
    def __init__(self, message: str, field: Optional[str] = None):
        detail = {"field": field} if field else {}
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class ExternalApiError(ApiError):
    """외부 API 호출 에러"""
    def __init__(self, service: str, message: Optional[str] = None):
        error_message = f"{service} API 호출에 실패했습니다."
        if message:
            error_message = f"{service} API 오류: {message}"
        super().__init__(
            message=error_message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"service": service}
        )


def handle_api_error(error: Exception) -> HTTPException:
    """
    ApiError를 HTTPException으로 변환
    
    Args:
        error: ApiError 또는 일반 Exception
        
    Returns:
        HTTPException: FastAPI에서 사용할 수 있는 HTTP 예외
    """
    if isinstance(error, ApiError):
        return HTTPException(
            status_code=error.status_code,
            detail={
                "message": error.message,
                **error.detail
            }
        )
    
    # 알 수 없는 에러는 500으로 처리
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "message": "서버 내부 오류가 발생했습니다.",
            "error": str(error)
        }
    )


def create_error_response(
    message: str,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    일관된 에러 응답 생성
    
    Args:
        message: 에러 메시지
        status_code: HTTP 상태 코드
        detail: 추가 상세 정보
        
    Returns:
        에러 응답 딕셔너리
    """
    response = {
        "error": True,
        "message": message,
        "status_code": status_code
    }
    
    if detail:
        response["detail"] = detail
    
    return response

