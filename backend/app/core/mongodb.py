from pymongo import MongoClient
from app.core.config import settings
from typing import Optional

class MongoDB:
    client: Optional[MongoClient] = None

mongodb = MongoDB()

def connect_to_mongo():
    """MongoDB 연결"""
    mongodb.client = MongoClient(settings.MONGODB_URL)
    # 연결 테스트 생략 (로컬 테스트용)
    # mongodb.client.admin.command('ping')

def close_mongo_connection():
    """MongoDB 연결 종료"""
    if mongodb.client:
        mongodb.client.close()

def get_database():
    """데이터베이스 인스턴스 반환"""
    if not mongodb.client:
        connect_to_mongo()
    return mongodb.client[settings.MONGODB_DB_NAME]

