from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import requests
from datetime import datetime
from app.core.config import settings

router = APIRouter()

@router.get("/exchange-rate/")
async def get_exchange_rate(
    from_currency: str = Query("USD", description="기준 통화"),
    to_currency: str = Query("KRW", description="변환 통화")
):
    """환율 조회"""
    try:
        # 실제 API 호출 로직 (예시)
        # 여기서는 간단한 응답만 반환
        # 실제로는 외부 환율 API를 호출해야 함
        
        # 프론트엔드가 기대하는 형식: { rates: {...}, date: "..." }
        # 예시 환율 데이터 (실제로는 외부 API에서 가져와야 함)
        rates = {
            "USD": 1300.0,
            "KRW": 1.0,
            "EUR": 1400.0,
            "JPY(100)": 8.5,
            "GBP": 1600.0,
            "CNH": 180.0,
            "CAD": 950.0,
            "AUD": 850.0,
            "CHF": 1450.0,
            "SGD": 960.0,
            "HKD": 165.0,
            "THB": 35.0,
            "MYR": 275.0,
            "IDR(100)": 8.0,
            "SAR": 345.0,
            "AED": 353.0,
            "NZD": 780.0,
            "SEK": 120.0,
            "NOK": 120.0,
            "DKK": 185.0,
            "BHD": 3450.0,
            "BND": 960.0,
            "KWD": 4250.0
        }
        
        # 날짜 형식: YYYYMMDD
        date_str = datetime.now().strftime("%Y%m%d")
        
        return {
            "rates": rates,
            "date": date_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/holidays/")
async def get_holidays(
    year: int = Query(None, description="연도"),
    month: int = Query(None, description="월")
):
    """공휴일 조회"""
    try:
        # 실제 API 호출 로직 (예시)
        # 여기서는 간단한 응답만 반환
        holidays = []
        return {
            "year": year or datetime.now().year,
            "month": month,
            "holidays": holidays
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lunar/")
async def convert_lunar(
    year: int = Query(..., description="연도"),
    month: int = Query(..., description="월"),
    day: int = Query(..., description="일")
):
    """음력 변환"""
    try:
        # 실제 API 호출 로직 (예시)
        # 여기서는 간단한 응답만 반환
        return {
            "solar": {
                "year": year,
                "month": month,
                "day": day
            },
            "lunar": {
                "year": year,
                "month": month,
                "day": day
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ip/")
async def get_ip():
    """IP 주소 조회"""
    try:
        # 외부 서비스를 통해 IP 조회
        response = requests.get("https://api.ipify.org?format=json", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            return {"ip": "unknown"}
    except Exception as e:
        return {"ip": "unknown"}

