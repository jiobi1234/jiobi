// API 클라이언트 설정

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  apiVersion: API_VERSION,
  apiPrefix: `${API_BASE_URL}${API_VERSION}`,
  tokenKey: 'jiobi_access_token',
} as const;

