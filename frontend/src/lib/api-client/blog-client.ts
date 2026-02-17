// 블로그 API 클라이언트

import { BaseApiClient } from './base-client';
import type {
  BlogInfo,
  BlogPost,
  BlogPostsResponse,
} from './types';

export class BlogClient extends BaseApiClient {
  /**
   * 블로그 정보
   */
  async getBlogInfo(): Promise<BlogInfo> {
    return this.get<BlogInfo>('/blog/info', undefined, false);
  }

  /**
   * 블로그 포스트 목록
   */
  async getBlogPosts(
    category?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<BlogPostsResponse> {
    return this.get<BlogPostsResponse>('/blog/posts', {
      category,
      page,
      limit,
    }, false);
  }
}

