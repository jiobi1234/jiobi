"""
MongoDB 캐시 TTL 인덱스 설정 스크립트
검색 결과 캐시를 24시간 후 자동 삭제
"""

import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.mongodb import get_database, connect_to_mongo, close_mongo_connection
from pymongo import IndexModel
from datetime import datetime

def setup_cache_indexes():
    """캐시 컬렉션에 TTL 인덱스 설정"""
    try:
        connect_to_mongo()
        db = get_database()
        cache_collection = db.search_cache
        
        # 기존 인덱스 삭제 (선택사항)
        try:
            cache_collection.drop_index("expires_at_1")
        except:
            pass
        
        # TTL 인덱스 생성 (expires_at 필드 기준, 24시간 후 자동 삭제)
        cache_collection.create_index(
            [("expires_at", 1)],
            name="expires_at_ttl",
            expireAfterSeconds=0  # expires_at 시간이 지나면 자동 삭제
        )
        
        # cache_key 인덱스 생성 (검색 성능 향상)
        cache_collection.create_index(
            [("cache_key", 1)],
            name="cache_key_index",
            unique=True
        )
        
        print("✅ 캐시 TTL 인덱스 설정 완료!")
        print("   - expires_at 필드 기준으로 24시간 후 자동 삭제")
        print("   - cache_key 인덱스로 빠른 검색 지원")
        
        # 인덱스 확인
        indexes = list(cache_collection.list_indexes())
        print(f"\n현재 인덱스 목록:")
        for idx in indexes:
            print(f"   - {idx.get('name')}: {idx.get('key')}")
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        close_mongo_connection()

if __name__ == "__main__":
    print("MongoDB 캐시 TTL 인덱스 설정 시작...")
    setup_cache_indexes()
    print("\n완료!")

