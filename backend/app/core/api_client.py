import requests
from typing import Dict, Any, Optional
from app.core.config import settings

class APIClient:
    """공통 API 클라이언트"""
    
    @staticmethod
    def get(url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        """GET 요청"""
        return requests.get(url, params=params, headers=headers, timeout=10)
    
    @staticmethod
    def post(url: str, json: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        """POST 요청"""
        return requests.post(url, json=json, headers=headers, timeout=10)

