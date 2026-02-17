// 기본 API 클라이언트

import { API_CONFIG } from './config';
import type { ApiError } from './types';
import { requestDeduplication } from './request-deduplication';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public originalError?: unknown
  ) {
    super(detail);
    this.name = 'ApiClientError';
  }
}

export class BaseApiClient {
  protected baseURL: string;

  constructor(baseURL: string = API_CONFIG.apiPrefix) {
    this.baseURL = baseURL;
  }

  /**
   * 토큰 가져오기
   */
  protected getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(API_CONFIG.tokenKey);
  }

  /**
   * 토큰 저장하기
   */
  protected setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_CONFIG.tokenKey, token);
  }

  /**
   * 토큰 제거하기
   */
  protected removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(API_CONFIG.tokenKey);
  }

  /**
   * 현재 언어 가져오기
   */
  protected getCurrentLocale(): string {
    if (typeof window === 'undefined') return 'en';
    
    // 1. URL에서 locale 추출 시도
    const pathname = window.location.pathname;
    const localeMatch = pathname.match(/^\/(ko|en)(\/|$)/);
    if (localeMatch) {
      return localeMatch[1];
    }
    
    // 2. localStorage에서 언어 확인
    const storedLocale = localStorage.getItem('user-lang');
    if (storedLocale === 'ko' || storedLocale === 'en') {
      return storedLocale;
    }
    
    // 3. 기본값 반환
    return 'en';
  }

  /**
   * HTTP 요청 헤더 생성
   */
  protected getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept-Language': this.getCurrentLocale(),
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * 에러 처리
   */
  protected handleError(response: Response, data?: any): never {
    const error: ApiError = data?.detail 
      ? { detail: data.detail, status_code: response.status }
      : { detail: `HTTP ${response.status}: ${response.statusText}`, status_code: response.status };

    // 401 Unauthorized인 경우 토큰 제거
    if (response.status === 401) {
      this.removeToken();
    }

    throw new ApiClientError(response.status, error.detail, error);
  }

  /**
   * GET 요청
   */
  protected async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    includeAuth: boolean = true
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const requestKey = `GET:${url.toString()}`;

    return requestDeduplication.deduplicate(requestKey, async () => {
      const requestUrl = url.toString();
      console.log('API 요청 URL:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
        mode: 'cors',  // CORS 명시적 설정
        credentials: 'include',  // 쿠키 포함
      });

      console.log('API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러:', errorData);
        this.handleError(response, errorData);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);
      return data;
    });
  }

  /**
   * POST 요청
   */
  protected async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      this.handleError(response, errorData);
    }

    return response.json();
  }

  /**
   * PUT 요청
   */
  protected async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      this.handleError(response, errorData);
    }

    return response.json();
  }

  /**
   * DELETE 요청
   */
  protected async delete<T>(
    endpoint: string,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      this.handleError(response, errorData);
    }

    return response.json();
  }
}

