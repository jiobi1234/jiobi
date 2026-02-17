import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse

class TistoryCrawler:
    """Tistory 블로그 크롤러"""
    
    def __init__(self, blog_url: str):
        self.blog_url = blog_url.rstrip('/')
        parsed = urlparse(self.blog_url)
        self.blog_id = parsed.netloc.split('.')[0] if '.' in parsed.netloc else parsed.netloc
    
    def get_blog_info(self) -> Dict[str, Any]:
        """블로그 정보 조회"""
        try:
            response = requests.get(self.blog_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = soup.find('title')
            title_text = title.text if title else self.blog_id
            
            return {
                "blog_id": self.blog_id,
                "blog_url": self.blog_url,
                "title": title_text
            }
        except Exception as e:
            raise Exception(f"Failed to get blog info: {str(e)}")
    
    def get_posts(self, category: Optional[str] = None, page: int = 1, limit: int = 10) -> List[Dict[str, Any]]:
        """카테고리별 포스트 조회"""
        try:
            if category:
                url = f"{self.blog_url}/category/{category}"
            else:
                url = self.blog_url
            
            if page > 1:
                url = f"{url}?page={page}"
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            posts = self._parse_posts_from_page(soup)
            return posts[:limit]
        except Exception as e:
            raise Exception(f"Failed to get posts: {str(e)}")
    
    def get_recent_posts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """최근 포스트 조회"""
        return self.get_posts(category=None, page=1, limit=limit)
    
    def _parse_posts_from_page(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """페이지에서 포스트 파싱"""
        posts = []
        
        # Tistory 블로그 구조에 맞게 포스트 찾기
        # 일반적으로 article, .post, .entry 등의 클래스를 사용
        post_elements = soup.find_all(['article', 'div'], class_=lambda x: x and ('post' in x.lower() or 'entry' in x.lower() or 'article' in x.lower()))
        
        if not post_elements:
            # 대체 방법: 링크가 있는 항목 찾기
            post_elements = soup.find_all('a', href=lambda x: x and '/entry/' in x)
        
        for element in post_elements:
            try:
                post = self._parse_post_element(element)
                if post:
                    posts.append(post)
            except:
                continue
        
        return posts
    
    def _parse_post_element(self, element) -> Optional[Dict[str, Any]]:
        """포스트 요소 파싱"""
        try:
            # 제목 찾기
            title_elem = element.find(['h1', 'h2', 'h3', 'a'])
            title = title_elem.text.strip() if title_elem else "Untitled"
            
            # 링크 찾기
            link_elem = element.find('a', href=True) if element.name != 'a' else element
            link = link_elem.get('href', '') if link_elem else ''
            if link and not link.startswith('http'):
                link = urljoin(self.blog_url, link)
            
            # 날짜 찾기
            date_elem = element.find(['time', 'span'], class_=lambda x: x and 'date' in x.lower() if x else False)
            date = date_elem.text.strip() if date_elem else ""
            
            # 요약 찾기
            summary_elem = element.find(['p', 'div'], class_=lambda x: x and ('summary' in x.lower() or 'excerpt' in x.lower()) if x else False)
            summary = summary_elem.text.strip() if summary_elem else ""
            
            # 이미지 찾기
            img_elem = element.find('img')
            thumbnail = img_elem.get('src', '') if img_elem else ''
            if thumbnail and not thumbnail.startswith('http'):
                thumbnail = urljoin(self.blog_url, thumbnail)
            
            return {
                "title": title,
                "link": link,
                "date": date,
                "summary": summary,
                "thumbnail": thumbnail
            }
        except:
            return None
    
    def get_post_detail(self, post_url: str) -> Dict[str, Any]:
        """포스트 상세 정보"""
        try:
            response = requests.get(post_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 제목
            title_elem = soup.find(['h1', 'h2', 'title'])
            title = title_elem.text.strip() if title_elem else "Untitled"
            
            # 본문
            content_elem = soup.find(['article', 'div'], class_=lambda x: x and ('content' in x.lower() or 'entry' in x.lower()) if x else False)
            if not content_elem:
                content_elem = soup.find('div', id=lambda x: x and 'content' in x.lower() if x else False)
            content = str(content_elem) if content_elem else ""
            
            # 날짜
            date_elem = soup.find(['time', 'span'], class_=lambda x: x and 'date' in x.lower() if x else False)
            date = date_elem.text.strip() if date_elem else ""
            
            return {
                "title": title,
                "content": content,
                "date": date,
                "url": post_url
            }
        except Exception as e:
            raise Exception(f"Failed to get post detail: {str(e)}")

