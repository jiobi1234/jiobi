// API 클라이언트 메인 진입점

import { AuthClient } from './auth-client';
import { HkClient } from './hk-client';
import { UtilClient } from './util-client';
import { BlogClient } from './blog-client';
import { API_CONFIG } from './config';

// 싱글톤 인스턴스 생성
export const authClient = new AuthClient();
export const hkClient = new HkClient();
export const utilClient = new UtilClient();
export const blogClient = new BlogClient();

// 모든 클라이언트를 하나의 객체로 내보내기
export const apiClient = {
  auth: authClient,
  hk: hkClient,
  util: utilClient,
  blog: blogClient,
};

// 타입 내보내기
export * from './types';
export { ApiClientError } from './base-client';
export { API_CONFIG };

// 기본 내보내기
export default apiClient;

