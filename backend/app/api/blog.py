from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.tistory_crawler import TistoryCrawler
from app.core.config import settings

router = APIRouter()

@router.get("/info")
async def get_blog_info():
    """블로그 정보"""
    try:
        if not settings.TISTORY_BLOG_URL:
            raise HTTPException(status_code=500, detail="Tistory blog URL not configured")
        
        crawler = TistoryCrawler(settings.TISTORY_BLOG_URL)
        info = crawler.get_blog_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts")
async def get_blog_posts(
    category: Optional[str] = Query(None, description="카테고리"),
    page: int = Query(1, description="페이지 번호"),
    limit: int = Query(10, description="페이지당 개수")
):
    """블로그 포스트 목록"""
    try:
        if not settings.TISTORY_BLOG_URL:
            raise HTTPException(status_code=500, detail="Tistory blog URL not configured")
        
        crawler = TistoryCrawler(settings.TISTORY_BLOG_URL)
        
        if category:
            posts = crawler.get_posts(category=category, page=page, limit=limit)
        else:
            posts = crawler.get_recent_posts(limit=limit)
        
        return {
            "posts": posts,
            "page": page,
            "limit": limit,
            "total": len(posts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

