// 블로그 관련 API 타입 정의

export interface BlogPost {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  date?: string;
  category?: string;
  url?: string;
  [key: string]: any;
}

export interface BlogInfo {
  title: string;
  description?: string;
  url: string;
  [key: string]: any;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  page: number;
  limit: number;
  total: number;
}

