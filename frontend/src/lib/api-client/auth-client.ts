// 인증 API 클라이언트

import { BaseApiClient } from './base-client';
import type { LoginRequest, SignupRequest, TokenResponse, UserResponse } from './types';

export class AuthClient extends BaseApiClient {
  /**
   * 로그인
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.post<TokenResponse>('/auth/login', credentials, false);
    
    // 토큰 저장
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  /**
   * 회원가입
   */
  async signup(data: SignupRequest): Promise<TokenResponse> {
    const response = await this.post<TokenResponse>('/auth/signup', data, false);
    
    // 토큰 저장
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  /**
   * 로그아웃 (토큰 제거)
   */
  logout(): void {
    this.removeToken();
  }

  /**
   * 현재 토큰 확인
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  async getCurrentUser(): Promise<UserResponse> {
    return await this.get<UserResponse>('/auth/me');
  }
}

