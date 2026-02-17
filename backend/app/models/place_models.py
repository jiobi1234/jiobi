"""
Place 데이터 모델 및 변환 유틸리티
외부 API 응답을 통합 Place 모델로 변환
"""

import re
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Place:
    """통합 Place 모델"""
    id: Optional[str] = None
    place_id: Optional[str] = None
    title: Optional[str] = None
    place_name: Optional[str] = None
    address: Optional[str] = None
    address_name: Optional[str] = None
    addr1: Optional[str] = None  # 주소 (지번 주소)
    addr2: Optional[str] = None  # 상세 주소
    tel: Optional[str] = None  # 전화번호
    description: Optional[str] = None
    image: Optional[str] = None
    kakao_url: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # TourAPI 추가 정보
    homepage: Optional[str] = None  # 홈페이지
    zipcode: Optional[str] = None  # 우편번호
    usetime: Optional[str] = None  # 이용시간
    restdate: Optional[str] = None  # 휴무일
    parking: Optional[str] = None  # 주차 정보
    infocenter: Optional[str] = None  # 문의처
    firstmenu: Optional[str] = None  # 대표 메뉴 (음식점)
    treatmenu: Optional[str] = None  # 취급 메뉴 (음식점)
    checkintime: Optional[str] = None  # 체크인 시간 (숙박)
    checkouttime: Optional[str] = None  # 체크아웃 시간 (숙박)
    
    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환 (None 값 제외)"""
        result = {}
        for key, value in asdict(self).items():
            if value is not None:
                result[key] = value
        return result


class PlaceNormalizer:
    """외부 API 응답을 통합 Place 모델로 변환"""
    
    @staticmethod
    def from_tour_api(item: Dict[str, Any]) -> Place:
        """TourAPI 응답을 Place로 변환"""
        content_id = str(item.get("contentid", ""))
        title = item.get("title", "")
        addr1 = item.get("addr1", "")
        addr2 = item.get("addr2", "")
        first_image = item.get("firstimage", "")
        first_image2 = item.get("firstimage2", "")
        
        # 주소 합치기
        address = " ".join(filter(None, [addr1, addr2]))
        
        # 이미지 URL (firstimage2가 있으면 우선 사용)
        image = first_image2 or first_image or ""
        
        # 지역 추출 (주소에서)
        region = None
        district = None
        if address:
            if "서울" in address:
                region = "서울"
            elif "경기" in address:
                region = "경기"
            elif "인천" in address:
                region = "인천"
            elif "부산" in address:
                region = "부산"
            elif "대구" in address:
                region = "대구"
            elif "광주" in address:
                region = "광주"
            elif "대전" in address:
                region = "대전"
            elif "울산" in address:
                region = "울산"
            
            # 구/군 추출
            for gu in ["구", "시", "군", "도"]:
                if gu in address:
                    parts = address.split(gu)
                    if len(parts) > 1:
                        district = parts[0].split()[-1] + gu
                        break
        
        # 전화번호 추출
        tel = item.get("tel") or item.get("telname") or ""
        
        # 개요 추출
        overview = item.get("overview") or ""
        
        # 추가 정보 추출 (홈페이지가 HTML이면 href URL만 추출)
        homepage = item.get("homepage", "").strip()
        if homepage and ("<a " in homepage or "href=" in homepage):
            m = re.search(r'href=["\']([^"\']+)["\']', homepage)
            if m:
                homepage = m.group(1).strip()
        zipcode = item.get("zipcode", "").strip()
        usetime = item.get("usetime", "").strip()
        restdate = item.get("restdate", "").strip()
        parking = item.get("parking", "").strip()
        infocenter = item.get("infocenter", "").strip()
        firstmenu = item.get("firstmenu", "").strip()
        treatmenu = item.get("treatmenu", "").strip()
        checkintime = item.get("checkintime", "").strip()
        checkouttime = item.get("checkouttime", "").strip()
        
        return Place(
            id=content_id,
            place_id=content_id,
            title=title,
            place_name=title,
            address=address,
            address_name=address,
            addr1=addr1 if addr1 else None,  # 주소 (지번 주소) - 빈 문자열은 None으로
            addr2=addr2 if addr2 else None,  # 상세 주소 - 빈 문자열은 None으로
            tel=tel if tel else None,  # 전화번호 - 빈 문자열은 None으로
            description=overview if overview else None,  # 개요 - 빈 문자열은 None으로
            image=image,
            kakao_url=None,  # TourAPI는 kakao_url을 제공하지 않음
            region=region,
            district=district,
            category=item.get("contenttypeid", ""),
            latitude=float(item.get("mapy", 0)) if item.get("mapy") else None,
            longitude=float(item.get("mapx", 0)) if item.get("mapx") else None,
            # 추가 정보
            homepage=homepage if homepage else None,
            zipcode=zipcode if zipcode else None,
            usetime=usetime if usetime else None,
            restdate=restdate if restdate else None,
            parking=parking if parking else None,
            infocenter=infocenter if infocenter else None,
            firstmenu=firstmenu if firstmenu else None,
            treatmenu=treatmenu if treatmenu else None,
            checkintime=checkintime if checkintime else None,
            checkouttime=checkouttime if checkouttime else None,
        )
    
    @staticmethod
    def from_kakao_api(item: Dict[str, Any]) -> Place:
        """KakaoAPI 응답을 Place로 변환"""
        place_id = item.get("id", "")
        place_name = item.get("place_name", "")
        address_name = item.get("address_name", "")
        road_address_name = item.get("road_address_name", "")
        phone = item.get("phone", "")
        category_name = item.get("category_name", "")
        
        # 주소 (도로명 주소 우선, 없으면 지번 주소)
        address = road_address_name or address_name or ""
        
        # 이미지 URL (KakaoAPI는 이미지 제공 안 함)
        image = ""
        
        # 지역 추출
        region = None
        district = None
        if address_name:
            if "서울" in address_name:
                region = "서울"
            elif "경기" in address_name:
                region = "경기"
            elif "인천" in address_name:
                region = "인천"
            elif "부산" in address_name:
                region = "부산"
            elif "대구" in address_name:
                region = "대구"
            elif "광주" in address_name:
                region = "광주"
            elif "대전" in address_name:
                region = "대전"
            elif "울산" in address_name:
                region = "울산"
            
            # 구/군 추출
            for gu in ["구", "시", "군"]:
                if gu in address_name:
                    parts = address_name.split(gu)
                    if len(parts) > 1:
                        district = parts[0].split()[-1] + gu
                        break
        
        # 카테고리 추출
        category = None
        if category_name:
            if "관광" in category_name or "명소" in category_name:
                category = "tourist"
            elif "음식" in category_name or "식당" in category_name:
                category = "restaurant"
            elif "숙박" in category_name or "호텔" in category_name:
                category = "accommodation"
            elif "행사" in category_name or "축제" in category_name:
                category = "event"
        
        return Place(
            id=place_id,
            place_id=place_id,
            title=place_name,
            place_name=place_name,
            address=address,
            address_name=address_name,
            description=category_name or "",
            image=image,
            kakao_url=f"https://place.map.kakao.com/{place_id}" if place_id else None,
            region=region,
            district=district,
            category=category,
            latitude=float(item.get("y", 0)) if item.get("y") else None,
            longitude=float(item.get("x", 0)) if item.get("x") else None,
        )
    
    @staticmethod
    def normalize_list(items: List[Dict[str, Any]], source: str = "tour") -> List[Place]:
        """리스트를 Place 리스트로 변환"""
        if source == "tour":
            return [PlaceNormalizer.from_tour_api(item) for item in items]
        elif source == "kakao":
            return [PlaceNormalizer.from_kakao_api(item) for item in items]
        else:
            return []

