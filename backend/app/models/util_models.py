from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ExchangeRateRequest(BaseModel):
    from_currency: str = "USD"
    to_currency: str = "KRW"

class ExchangeRateResponse(BaseModel):
    from_currency: str
    to_currency: str
    rate: float
    date: datetime

class HolidayRequest(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None

class HolidayResponse(BaseModel):
    year: int
    month: Optional[int]
    holidays: list

class LunarRequest(BaseModel):
    year: int
    month: int
    day: int

class LunarResponse(BaseModel):
    solar: dict
    lunar: dict

class IPResponse(BaseModel):
    ip: str

