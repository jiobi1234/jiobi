from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path

# backend 폴더 기준으로 .env 파일 경로 찾기
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: Optional[str] = "mongodb://localhost:27017" # Default for local dev/test
    MONGO_DB_CONNECTION_STRING: Optional[str] = None  # 별칭 지원
    MONGODB_DB_NAME: str = "jiobi"
    
    # JWT
    JWT_SECRET_KEY: Optional[str] = None
    SECRET_KEY: Optional[str] = None  # 별칭 지원
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # TourAPI
    TOUR_API_KEY: Optional[str] = None
    TOURAPI_KEY: Optional[str] = None  # 별칭 지원
    PUBLIC_DATA_API_KEY: Optional[str] = None  # 별칭 지원
    TOUR_API_BASE_URL: str = "https://apis.data.go.kr/B551011/KorService2"
    
    # Kakao API (로컬 장소/검색)
    KAKAO_REST_API_KEY: Optional[str] = None
    KAKAO_API_KEY: Optional[str] = None  # 별칭 지원
    KAKAO_API_BASE_URL: str = "https://dapi.kakao.com/v2"
    
    # Kakao 모빌리티 (길찾기 / 내비게이션)
    KAKAO_MOBILITY_REST_API_KEY: Optional[str] = None
    KAKAO_MOBILITY_API_BASE_URL: str = "https://apis-navi.kakaomobility.com/v1"
    
    # Kakao Map API (별칭)
    KAKAOMAP_API_KEY: Optional[str] = None
    
    # Google Maps API
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_BASE_URL: str = "https://maps.googleapis.com/maps/api"
    
    # Google OAuth (Social Login)
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None
    GOOGLE_OAUTH_REDIRECT_URI: Optional[str] = None
    
    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    
    # Tistory Blog
    TISTORY_BLOG_URL: Optional[str] = None
    
    # Place API Provider 설정 (tour 또는 kakao)
    PLACE_API_PROVIDER: str = "tour"  # 기본값: tour
    
    # Admin 설정
    ADMIN_EMAIL: Optional[str] = None  # 관리자 이메일
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # 정의되지 않은 필드는 무시
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 디버깅: .env 파일 경로 및 존재 여부 확인
        # print(f"DEBUG: ENV_FILE path: {ENV_FILE}")
        # print(f"DEBUG: ENV_FILE exists: {ENV_FILE.exists()}")

        # 별칭 처리: 다른 이름의 변수를 올바른 이름으로 매핑
        if not self.MONGODB_URL and self.MONGO_DB_CONNECTION_STRING:
            self.MONGODB_URL = self.MONGO_DB_CONNECTION_STRING
        
        if not self.JWT_SECRET_KEY and self.SECRET_KEY:
            self.JWT_SECRET_KEY = self.SECRET_KEY
        
        if not self.TOUR_API_KEY:
            if self.TOURAPI_KEY:
                self.TOUR_API_KEY = self.TOURAPI_KEY
            elif self.PUBLIC_DATA_API_KEY:
                self.TOUR_API_KEY = self.PUBLIC_DATA_API_KEY
        
        if not self.KAKAO_REST_API_KEY and self.KAKAO_API_KEY:
            self.KAKAO_REST_API_KEY = self.KAKAO_API_KEY
        
        # 환경 변수가 없으면 에러 발생 (보안을 위해 하드코딩된 값 제거)
        if not self.MONGODB_URL:
            raise ValueError(
                "MONGODB_URL 환경 변수가 설정되지 않았습니다. "
                "backend/.env 파일에 MONGODB_URL을 설정하세요."
            )
        
        if not self.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY 환경 변수가 설정되지 않았습니다. "
                "backend/.env 파일에 JWT_SECRET_KEY를 설정하세요."
            )

settings = Settings()

